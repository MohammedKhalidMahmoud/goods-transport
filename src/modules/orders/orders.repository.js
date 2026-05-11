const { prisma } = require('../../lib/prisma');

function appendHistory(tx, orderId, fromStatus, toStatus, userId, notes) {
  return tx.orderStatusHistory.create({
    data: { orderId, fromStatus, toStatus, changedBy: userId, notes },
  });
}

class OrdersRepository {
  loadOrderForAccess(orderId) {
    return prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      include: {
        service: true,
        requester: true,
        locations: true,
        items: true,
        attachments: true,
        offers: true,
        assignments: {
          include: { driver: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  findActiveDriverIdsByUser(userId) {
    return prisma.providerDriver.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });
  }

  findProviderRelatedOrderIds(providerId) {
    return prisma.order.findMany({
      where: {
        deletedAt: null,
        OR: [
          { offers: { some: { providerId } } },
          { assignments: { some: { providerId } } },
        ],
      },
      select: { id: true },
    });
  }

  countOrders(where) {
    return prisma.order.count({ where });
  }

  findOrders({ where, orderBy, skip, take }) {
    return prisma.order.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { service: true, requester: true },
    });
  }

  findService(id) {
    return prisma.service.findUnique({ where: { id } });
  }

  async createOrderWithDetails(data, locations, items, userId) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data });

      for (const loc of locations || []) {
        await tx.orderLocation.create({
          data: {
            orderId: order.id,
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

      for (const item of items || []) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            name: item.name,
            quantity: item.quantity ?? 1,
            description: item.description,
            isFragile: !!item.isFragile,
            weight: item.weight,
            dimensions: item.dimensions,
          },
        });
      }

      await appendHistory(tx, order.id, null, 'draft', userId, 'Created');
      return order;
    });
  }

  findOrderWithDetails(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: { locations: true, items: true, service: true },
    });
  }

  updateOrder(orderId, data) {
    return prisma.order.update({
      where: { id: orderId },
      data,
      include: { locations: true, items: true, service: true },
    });
  }

  markOrderDeleted(orderId, data) {
    return prisma.order.update({
      where: { id: orderId },
      data,
    });
  }

  findOrderLocations(orderId) {
    return prisma.orderLocation.findMany({ where: { orderId } });
  }

  async submitOrder(orderId, userId) {
    return prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'published_for_offers', updatedBy: userId },
      });
      await appendHistory(tx, orderId, 'draft', 'submitted', userId, 'Submitted');
      await appendHistory(tx, orderId, 'submitted', 'published_for_offers', userId, 'Published');
    });
  }

  findOrderAfterSubmit(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: { locations: true, items: true, statusHistory: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  async publishOrder(orderId, fromStatus, userId) {
    return prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'published_for_offers', updatedBy: userId },
      });
      await appendHistory(tx, orderId, fromStatus, 'published_for_offers', userId, 'Published');
    });
  }

  async cancelOrder(orderId, fromStatus, reason, userId) {
    return prisma.$transaction(async (tx) => {
      await tx.cancellation.upsert({
        where: { orderId },
        create: { orderId, reason, canceledBy: userId },
        update: { reason, canceledBy: userId },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'canceled', cancelReason: reason, updatedBy: userId },
      });
      await appendHistory(tx, orderId, fromStatus, 'canceled', userId, reason);
      await tx.offer.updateMany({
        where: { orderId, status: 'pending' },
        data: { status: 'expired', respondedAt: new Date(), respondedBy: userId },
      });
    });
  }

  async assignOrder(orderId, fromStatus, data, userId) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.create({
        data: {
          orderId,
          providerId: data.providerId,
          driverId: data.driverId || null,
          status: data.driverId ? 'accepted' : 'pending',
          assignedBy: userId,
          acceptedAt: data.driverId ? new Date() : null,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'assigned', updatedBy: userId },
      });
      await appendHistory(tx, orderId, fromStatus, 'assigned', userId, 'Assigned');
      return assignment;
    });
  }

  findPendingAssignmentForProviderOrder(orderId, providerId) {
    return prisma.assignment.findFirst({
      where: { orderId, providerId, status: 'pending' },
      include: { order: true, provider: true, driver: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findProviderDriver(driverId, providerId) {
    return prisma.providerDriver.findFirst({
      where: { id: driverId, providerId, isActive: true },
    });
  }

  async acceptProviderAssignment(assignmentId, data) {
    return prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'accepted',
        driverId: data.driverId,
        notes: data.notes,
        acceptedAt: new Date(),
      },
      include: { order: true, provider: true, driver: true },
    });
  }

  async rejectProviderAssignment(assignment, data) {
    return prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          status: 'rejected',
          notes: data.reason,
        },
        include: { provider: true, driver: true },
      });

      const activeAssignments = await tx.assignment.count({
        where: {
          orderId: assignment.orderId,
          id: { not: assignment.id },
          status: { in: ['pending', 'accepted', 'in_progress'] },
        },
      });

      let order = assignment.order;
      if (activeAssignments === 0 && assignment.order.status === 'assigned') {
        order = await tx.order.update({
          where: { id: assignment.orderId },
          data: { status: 'offer_accepted', updatedBy: data.updatedBy },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: assignment.orderId,
            fromStatus: assignment.order.status,
            toStatus: 'offer_accepted',
            changedBy: data.updatedBy,
            notes: data.reason,
          },
        });
      }

      return { assignment: updatedAssignment, order };
    });
  }

  async transitionOrder(orderId, fromStatus, toStatus, userId, notes) {
    return prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus,
          updatedBy: userId,
          completedAt: toStatus === 'completed' ? new Date() : undefined,
        },
      });
      await appendHistory(tx, orderId, fromStatus, toStatus, userId, notes);
    });
  }

  findStatusHistory(orderId) {
    return prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAttachments(orderId) {
    return prisma.orderAttachment.findMany({ where: { orderId } });
  }

  createAttachment(orderId, body, userId) {
    return prisma.orderAttachment.create({
      data: {
        orderId,
        fileName: body.fileName,
        originalName: body.originalName,
        filePath: body.filePath,
        mimeType: body.mimeType,
        fileSize: body.fileSize,
        uploadedBy: userId,
      },
    });
  }
}

module.exports = new OrdersRepository();
