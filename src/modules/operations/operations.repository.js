const { prisma } = require('../../lib/prisma');

class OperationsRepository {
  async listOffers(where, orderBy, skip, take) {
    const [total, rows] = await Promise.all([
      prisma.offer.count({ where }),
      prisma.offer.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { order: true, provider: true },
      }),
    ]);
    return { total, rows };
  }

  async findOrderById(id) {
    return prisma.order.findFirst({ where: { id, deletedAt: null } });
  }

  async findProviderById(id) {
    return prisma.provider.findFirst({ where: { id, deletedAt: null } });
  }

  async createOffer(data) {
    return prisma.offer.create({ data });
  }

  async findOfferById(id, include = undefined) {
    return prisma.offer.findUnique({ where: { id }, include });
  }

  async updateOffer(id, data) {
    return prisma.offer.update({ where: { id }, data });
  }

  async updateOrder(id, data) {
    return prisma.order.update({ where: { id }, data });
  }

  async createOrderStatusHistory(data) {
    return prisma.orderStatusHistory.create({ data });
  }

  async createNotification(data) {
    return prisma.notification.create({ data });
  }

  async acceptOffer(offer, userId) {
    await prisma.$transaction(async (tx) => {
      await tx.offer.updateMany({
        where: { orderId: offer.order.id, id: { not: offer.id }, status: 'pending' },
        data: { status: 'expired', respondedAt: new Date(), respondedBy: userId },
      });
      await tx.offer.update({
        where: { id: offer.id },
        data: { status: 'accepted', respondedAt: new Date(), respondedBy: userId },
      });
      await tx.order.update({
        where: { id: offer.order.id },
        data: { status: 'offer_accepted', finalPrice: offer.price, updatedBy: userId },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: offer.order.id,
          fromStatus: offer.order.status,
          toStatus: 'offer_accepted',
          changedBy: userId,
          notes: 'Offer accepted',
        },
      });
    });

    return this.findOfferById(offer.id);
  }

  async listAssignments(where, orderBy, skip, take) {
    const [total, rows] = await Promise.all([
      prisma.assignment.count({ where }),
      prisma.assignment.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { order: true, provider: true, driver: true },
      }),
    ]);
    return { total, rows };
  }

  async findProviderDriversByUser(userId) {
    return prisma.providerDriver.findMany({
      where: { userId },
      select: { id: true },
    });
  }

  async findAssignmentById(id) {
    return prisma.assignment.findUnique({
      where: { id },
      include: { order: true, provider: true, driver: true },
    });
  }

  async updateAssignment(id, data) {
    return prisma.assignment.update({ where: { id }, data });
  }

  async listOrderItems(orderId) {
    return prisma.orderItem.findMany({ where: { orderId } });
  }

  async createOrderItem(data) {
    return prisma.orderItem.create({ data });
  }

  async findOrderItemById(id) {
    return prisma.orderItem.findUnique({ where: { id } });
  }

  async updateOrderItem(id, data) {
    return prisma.orderItem.update({ where: { id }, data });
  }

  async deleteOrderItem(id) {
    return prisma.orderItem.delete({ where: { id } });
  }

  async findAssignmentForOrder(orderId, assignmentId) {
    if (assignmentId) {
      return prisma.assignment.findFirst({ where: { id: assignmentId, orderId } });
    }

    return prisma.assignment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listTrackingEvents(assignmentId, orderBy, take = undefined) {
    return prisma.trackingEvent.findMany({
      where: { assignmentId },
      orderBy,
      take,
    });
  }

  async createTrackingEvent(data) {
    return prisma.trackingEvent.create({ data });
  }

  async listDeliveryProofs(orderId) {
    return prisma.deliveryProof.findMany({ where: { orderId } });
  }

  async createDeliveryProof(data) {
    return prisma.deliveryProof.create({ data });
  }

  async updateDeliveryProof(id, data) {
    return prisma.deliveryProof.update({ where: { id }, data });
  }
}

module.exports = { OperationsRepository };
