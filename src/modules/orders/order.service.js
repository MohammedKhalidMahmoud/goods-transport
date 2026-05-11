const { parseListQuery } = require('../../lib/listQuery');
const { AppError } = require('../../utils/AppError');
const { mergeWhere, companyTenantWhere, requesterSelfWhere } = require('../../utils/tenantQuery');
const { assertCanViewOrder, loadOrderForAccess } = require('./order.access');
const { writeAudit } = require('../../services/audit.service');
const { getIo, emitOrder, emitProvider, emitCompany, EVENTS } = require('../../lib/socketEmitter');
const ordersRepository = require('./orders.repository');

function orderNumber() {
  return `GT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function needsCompanyApproval(order) {
  if (order.sourceType !== 'company' || !order.companyId) return false;

  const rules = await ordersRepository.findApprovalRules(order.companyId);
  if (rules.length === 0) return false;

  const serviceType = await ordersRepository.findServiceType(order.serviceTypeId);
  const code = serviceType?.code || null;
  const price = Number(order.estimatedPrice ?? order.finalPrice ?? 0);

  return rules.some((rule) => {
    if (rule.serviceTypeCode && rule.serviceTypeCode !== code) return false;
    if (rule.minAmount != null && price < Number(rule.minAmount)) return false;
    if (rule.maxAmount != null && price > Number(rule.maxAmount)) return false;
    return true;
  });
}

async function listOrders(query, user, tenantScope) {
  const lq = parseListQuery(query, { searchFields: ['orderNumber'] });
  let base = { deletedAt: null };

  if (tenantScope.type === 'global') {
    base = mergeWhere(base, {});
  } else if (tenantScope.type === 'company') {
    const filter = companyTenantWhere(tenantScope);
    base = mergeWhere(base, filter || { id: '___none___' });
  } else if (tenantScope.type === 'self') {
    const filter = requesterSelfWhere(tenantScope);
    base = mergeWhere(base, filter || { id: '___none___' });
  } else if (tenantScope.type === 'provider' && tenantScope.providerId) {
    const related = await ordersRepository.findProviderRelatedOrderIds(tenantScope.providerId);
    const ids = related.map((row) => row.id);
    base = mergeWhere(base, ids.length ? { id: { in: ids } } : { id: '___none___' });
  } else if (tenantScope.type === 'assignment') {
    const drivers = await ordersRepository.findActiveDriverIdsByUser(user.id);
    const driverIds = drivers.map((driver) => driver.id);
    base = mergeWhere(
      base,
      driverIds.length
        ? { assignments: { some: { driverId: { in: driverIds } } } }
        : { id: '___none___' }
    );
  }

  const where = mergeWhere(base, lq.where);
  const [total, rows] = await Promise.all([
    ordersRepository.countOrders(where),
    ordersRepository.findOrders({
      where,
      orderBy: lq.orderBy,
      skip: lq.skip,
      take: lq.take,
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

  const order = await ordersRepository.createOrderWithDetails(
    {
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
    locations,
    items,
    user.id
  );

  await writeAudit(req, 'order.create', 'Order', order.id, null, { id: order.id });
  return ordersRepository.findOrderWithDetails(order.id);
}

async function updateOrder(orderId, body, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  if (!['draft', 'submitted', 'pending_approval'].includes(order.status) && tenantScope.type !== 'global') {
    throw AppError.unprocessable('Order cannot be edited in current status');
  }
  if (tenantScope.type === 'self' && order.requesterId !== user.id) throw AppError.forbidden();
  if (tenantScope.type === 'company' && order.companyId !== tenantScope.companyId) throw AppError.forbidden();

  const updated = await ordersRepository.updateOrder(orderId, {
    vehicleTypeId: body.vehicleTypeId,
    workerCount: body.workerCount,
    isFragile: body.isFragile,
    notes: body.notes,
    scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
    scheduledTimeSlot: body.scheduledTimeSlot,
    estimatedPrice: body.estimatedPrice,
    updatedBy: user.id,
  });
  await writeAudit(req, 'order.update', 'Order', orderId, order, updated);
  return updated;
}

async function softDeleteOrder(orderId, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  if (order.status !== 'draft') throw AppError.unprocessable('Only draft orders can be deleted');
  await ordersRepository.markOrderDeleted(orderId, { deletedAt: new Date(), updatedBy: user.id });
  await writeAudit(req, 'order.delete', 'Order', orderId, null, null);
  return { id: orderId };
}

async function submitOrder(orderId, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  if (order.status !== 'draft') throw AppError.unprocessable('Invalid status for submit');

  const locations = await ordersRepository.findOrderLocations(orderId);
  const hasPickup = locations.some((location) => location.type === 'pickup');
  const hasDropoff = locations.some((location) => location.type === 'dropoff');
  if (!hasPickup || !hasDropoff) throw AppError.badRequest('Pickup and dropoff locations required');

  const approval = await needsCompanyApproval(order);
  await ordersRepository.submitOrder(orderId, order, approval, user.id);

  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_STATUS, { orderId, status: 'published_for_offers' });
  if (order.companyId) emitCompany(io, order.companyId, EVENTS.ORDER_STATUS, { orderId });

  return ordersRepository.findOrderAfterSubmit(orderId);
}

async function publishOrder(orderId, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  const allowed = ['submitted', 'approved'];
  if (!allowed.includes(order.status)) throw AppError.unprocessable('Cannot publish from this status');

  await ordersRepository.publishOrder(orderId, order.status, user.id);
  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_STATUS, { orderId });
  return loadOrderForAccess(orderId);
}

async function cancelOrder(orderId, body, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  const terminal = ['completed', 'canceled', 'rejected'];
  if (terminal.includes(order.status)) throw AppError.unprocessable('Cannot cancel');

  const reason = body.reason || 'Canceled';
  await ordersRepository.cancelOrder(orderId, order.status, reason, user.id);

  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_STATUS, { orderId, status: 'canceled' });
  return loadOrderForAccess(orderId);
}

async function assignOrder(orderId, body, user, tenantScope, req) {
  const order = await assertCanViewOrder(user, tenantScope, orderId);
  if (!['offer_accepted', 'published_for_offers', 'offer_received'].includes(order.status)) {
    throw AppError.unprocessable('Order not ready for assignment');
  }
  if (!body.providerId) throw AppError.badRequest('providerId required');

  const assignment = await ordersRepository.assignOrder(orderId, order.status, body, user.id);
  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_ASSIGNED, { orderId, assignmentId: assignment.id });
  emitProvider(io, body.providerId, EVENTS.ORDER_ASSIGNED, { orderId });
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

  await ordersRepository.transitionOrder(orderId, order.status, nextStatus, user.id, notes);
  const io = getIo(req.app);
  emitOrder(io, orderId, EVENTS.ORDER_STATUS, { orderId, status: nextStatus });
  return loadOrderForAccess(orderId);
}

async function getOrderTimeline(orderId, user, tenantScope) {
  await assertCanViewOrder(user, tenantScope, orderId);
  return ordersRepository.findStatusHistory(orderId);
}

async function listOrderAttachments(orderId, user, tenantScope) {
  await assertCanViewOrder(user, tenantScope, orderId);
  return ordersRepository.findAttachments(orderId);
}

async function createOrderAttachment(orderId, body, user, tenantScope) {
  await assertCanViewOrder(user, tenantScope, orderId);
  return ordersRepository.createAttachment(orderId, body, user.id);
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
  getOrderTimeline,
  listOrderAttachments,
  createOrderAttachment,
  assertCanViewOrder,
  loadOrderForAccess,
};
