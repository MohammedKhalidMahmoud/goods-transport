const { prisma } = require('../../lib/prisma');
const { parseListQuery } = require('../../lib/listQuery');
const { AppError } = require('../../utils/AppError');
const { mergeWhere, companyTenantWhere, requesterSelfWhere } = require('../../utils/tenantQuery');
const { assertCanViewOrder, loadOrderForAccess } = require('./order.access');
const { writeAudit } = require('../../services/audit.service');
const { notifyUser } = require('../../services/notification.service');
const { getIo, emitOrder, emitProvider, emitCompany, EVENTS } = require('../../lib/socketEmitter');

function orderNumber() {
  return `GT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function appendHistory(tx, orderId, fromStatus, toStatus, userId, notes) {
  await tx.orderStatusHistory.create({
    data: { orderId, fromStatus, toStatus, changedBy: userId, notes },
  });
}

async function needsCompanyApproval(order) {
  if (order.sourceType !== 'company' || !order.companyId) return false;
  const rules = await prisma.approvalRule.findMany({
    where: { companyId: order.companyId, isActive: true },
  });
  if (rules.length === 0) return false;
  const st = await prisma.serviceType.findUnique({ where: { id: order.serviceTypeId } });
  const code = st?.code || null;
  const price = Number(order.estimatedPrice ?? order.finalPrice ?? 0);
  for (const r of rules) {
    let match = true;
    if (r.serviceTypeCode && r.serviceTypeCode !== code) match = false;
    if (r.minAmount != null && price < Number(r.minAmount)) match = false;
    if (r.maxAmount != null && price > Number(r.maxAmount)) match = false;
    if (match) return true;
  }
  return false;
}

async function listOrders(query, user, tenantScope) {
  const lq = parseListQuery(query, { searchFields: ['orderNumber'] });
  let base = { deletedAt: null };
  if (tenantScope.type === 'global') {
    base = mergeWhere(base, {});
  } else if (tenantScope.type === 'company') {
    const f = companyTenantWhere(tenantScope);
    base = mergeWhere(base, f || { id: '___none___' });
  } else if (tenantScope.type === 'self') {
    const f = requesterSelfWhere(tenantScope);
    base = mergeWhere(base, f || { id: '___none___' });
  } else if (tenantScope.type === 'provider' && tenantScope.providerId) {
    const pid = tenantScope.providerId;
    const related = await prisma.order.findMany({
      where: {
        deletedAt: null,
        OR: [
          { offers: { some: { providerId: pid } } },
          { assignments: { some: { providerId: pid } } },
        ],
      },
      select: { id: true },
    });
    const ids = related.map((r) => r.id);
    base = mergeWhere(base, ids.length ? { id: { in: ids } } : { id: '___none___' });
  } else if (tenantScope.type === 'assignment') {
    const drivers = await prisma.providerDriver.findMany({
      where: { userId: user.id, isActive: true },
      select: { id: true },
    });
    const dIds = drivers.map((d) => d.id);
    base = mergeWhere(
      base,
      dIds.length
        ? { assignments: { some: { driverId: { in: dIds } } } }
        : { id: '___none___' }
    );
  }

  const w = mergeWhere(base, lq.where);
  const [total, rows] = await Promise.all([
    prisma.order.count({ where: w }),
    prisma.order.findMany({
      where: w,
      orderBy: lq.orderBy,
      skip: lq.skip,
      take: lq.take,
      include: { serviceType: true, company: true, requester: { include: { profile: true } } },
    }),
  ]);
  return { rows, total, page: lq.page, limit: lq.limit };
}

async function createOrder(body, user, tenantScope, req) {
  const {
    sourceType,
    serviceTypeId,
    vehicleTypeId,
    workerCount,
    isFragile,
    notes,
    scheduledDate,
    scheduledTimeSlot,
    estimatedPrice,
    locations,
    items,
  } = body;

  let companyId = null;
  let src = sourceType || 'individual';
  if (tenantScope.type === 'company') {
    companyId = tenantScope.companyId;
    src = 'company';
  }

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        sourceType: src,
        requesterId: user.id,
        companyId,
        serviceTypeId,
        vehicleTypeId: vehicleTypeId || null,
        workerCount: workerCount ?? 1,
        isFragile: !!isFragile,
        notes,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledTimeSlot,
        estimatedPrice,
        status: 'draft',
        createdBy: user.id,
      },
    });
    if (locations?.length) {
      for (const loc of locations) {
        await tx.orderLocation.create({
          data: {
            orderId: o.id,
            type: loc.type,
            addressLine: loc.addressLine,
            city: loc.city,
            area: loc.area || null,
            latitude: loc.latitude,
            longitude: loc.longitude,
            floor: loc.floor,
            unit: loc.unit,
            hasElevator: !!loc.hasElevator,
            contactName: loc.contactName,
            contactPhone: loc.contactPhone,
            notes: loc.notes,
          },
        });
      }
    }
    if (items?.length) {
      for (const it of items) {
        await tx.orderItem.create({
          data: {
            orderId: o.id,
            name: it.name,
            quantity: it.quantity ?? 1,
            description: it.description,
            isFragile: !!it.isFragile,
            weight: it.weight,
            dimensions: it.dimensions,
          },
        });
      }
    }
    await appendHistory(tx, o.id, null, 'draft', user.id, 'Created');
    return o;
  });

  await writeAudit(req, 'order.create', 'Order', order.id, null, { id: order.id });
  return prisma.order.findUnique({
    where: { id: order.id },
    include: { locations: true, items: true, serviceType: true },
  });
}

async function updateOrder(orderId, body, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  if (!['draft', 'submitted', 'pending_approval'].includes(order.status) && tenantScope.type !== 'global') {
    throw AppError.unprocessable('Order cannot be edited in current status');
  }
  if (tenantScope.type === 'self' && order.requesterId !== user.id) throw AppError.forbidden();
  if (tenantScope.type === 'company' && order.companyId !== tenantScope.companyId) throw AppError.forbidden();

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      vehicleTypeId: body.vehicleTypeId,
      workerCount: body.workerCount,
      isFragile: body.isFragile,
      notes: body.notes,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
      scheduledTimeSlot: body.scheduledTimeSlot,
      estimatedPrice: body.estimatedPrice,
      updatedBy: user.id,
    },
    include: { locations: true, items: true, serviceType: true },
  });
  await writeAudit(req, 'order.update', 'Order', orderId, order, updated);
  return updated;
}

async function softDeleteOrder(orderId, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  if (order.status !== 'draft') throw AppError.unprocessable('Only draft orders can be deleted');
  await prisma.order.update({
    where: { id: orderId },
    data: { deletedAt: new Date(), updatedBy: user.id },
  });
  await writeAudit(req, 'order.delete', 'Order', orderId, null, null);
  return { id: orderId };
}

async function submitOrder(orderId, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  if (order.status !== 'draft') throw AppError.unprocessable('Invalid status for submit');
  const locs = await prisma.orderLocation.findMany({ where: { orderId } });
  const hasPickup = locs.some((l) => l.type === 'pickup');
  const hasDrop = locs.some((l) => l.type === 'dropoff');
  if (!hasPickup || !hasDrop) throw AppError.badRequest('Pickup and dropoff locations required');

  const full = { ...order, companyId: order.companyId, serviceTypeId: order.serviceTypeId };
  const approval = await needsCompanyApproval(full);

  await prisma.$transaction(async (tx) => {
    if (approval) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'pending_approval', updatedBy: user.id },
      });
      await appendHistory(tx, orderId, 'draft', 'submitted', user.id, 'Submitted');
      await appendHistory(tx, orderId, 'submitted', 'pending_approval', user.id, 'Awaiting approval');
    } else if (order.sourceType === 'company') {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'published_for_offers', updatedBy: user.id },
      });
      await appendHistory(tx, orderId, 'draft', 'submitted', user.id, 'Submitted');
      await appendHistory(tx, orderId, 'submitted', 'published_for_offers', user.id, 'Auto-published');
    } else {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'published_for_offers', updatedBy: user.id },
      });
      await appendHistory(tx, orderId, 'draft', 'submitted', user.id, 'Submitted');
      await appendHistory(tx, orderId, 'submitted', 'published_for_offers', user.id, 'Published');
    }
  });

  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_STATUS, { orderId, status: 'published_for_offers' });
  if (order.companyId) emitCompany(io, order.companyId, EVENTS.ORDER_STATUS, { orderId });

  return prisma.order.findUnique({
    where: { id: orderId },
    include: { locations: true, items: true, statusHistory: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
}

async function publishOrder(orderId, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  const allowed = ['submitted', 'approved'];
  if (!allowed.includes(order.status)) throw AppError.unprocessable('Cannot publish from this status');
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'published_for_offers', updatedBy: user.id },
    });
    await appendHistory(tx, orderId, order.status, 'published_for_offers', user.id, 'Published');
  });
  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_STATUS, { orderId });
  return loadOrderForAccess(orderId);
}

async function cancelOrder(orderId, body, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  const terminal = ['completed', 'canceled', 'rejected'];
  if (terminal.includes(order.status)) throw AppError.unprocessable('Cannot cancel');
  const reason = body.reason || 'Canceled';
  await prisma.$transaction(async (tx) => {
    await tx.cancellation.upsert({
      where: { orderId },
      create: { orderId, reason, canceledBy: user.id },
      update: { reason, canceledBy: user.id },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'canceled', cancelReason: reason, updatedBy: user.id },
    });
    await appendHistory(tx, orderId, order.status, 'canceled', user.id, reason);
    await tx.offer.updateMany({
      where: { orderId, status: 'pending' },
      data: { status: 'expired', respondedAt: new Date(), respondedBy: user.id },
    });
  });
  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_STATUS, { orderId, status: 'canceled' });
  return loadOrderForAccess(orderId);
}

async function assignOrder(orderId, body, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  if (!['offer_accepted', 'published_for_offers', 'offer_received'].includes(order.status)) {
    throw AppError.unprocessable('Order not ready for assignment');
  }
  const { providerId, driverId } = body;
  if (!providerId) throw AppError.badRequest('providerId required');
  const assignment = await prisma.$transaction(async (tx) => {
    const a = await tx.assignment.create({
      data: {
        orderId,
        providerId,
        driverId: driverId || null,
        status: driverId ? 'accepted' : 'pending',
        assignedBy: user.id,
        acceptedAt: driverId ? new Date() : null,
      },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'assigned', updatedBy: user.id },
    });
    await appendHistory(tx, orderId, order.status, 'assigned', user.id, 'Assigned');
    return a;
  });
  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_ASSIGNED, { orderId, assignmentId: assignment.id });
  emitProvider(io, providerId, EVENTS.ORDER_ASSIGNED, { orderId });
  return assignment;
}

async function transitionSimple(orderId, nextStatus, user, tenantScope, req, notes = '') {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  const validNext = {
    assigned: 'en_route_to_pickup',
    en_route_to_pickup: 'arrived_pickup',
    arrived_pickup: 'picked_up',
    picked_up: 'in_transit',
    in_transit: 'arrived_dropoff',
    arrived_dropoff: 'delivered',
    delivered: 'completed',
  };
  const expected = validNext[order.status];
  if (expected !== nextStatus) {
    throw AppError.unprocessable(`Invalid transition to ${nextStatus} from ${order.status}`);
  }
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: nextStatus, updatedBy: user.id, completedAt: nextStatus === 'completed' ? new Date() : undefined },
    });
    await appendHistory(tx, orderId, order.status, nextStatus, user.id, notes);
  });
  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_STATUS, { orderId, status: nextStatus });
  return loadOrderForAccess(orderId);
}

module.exports = {
  listOrders,
  createOrder,
  updateOrder,
  softDeleteOrder,
  submitOrder,
  publishOrder,
  cancelOrder,
  assignOrder,
  transitionSimple,
  assertCanViewOrder,
  loadOrderForAccess,
};
