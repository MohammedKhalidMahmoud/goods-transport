const { AppError } = require('../../utils/AppError');
const { parseListQuery } = require('../../lib/listQuery');
const { getIo, emitOrder, emitProvider, EVENTS } = require('../../lib/socketEmitter');
const orderAccess = require('../orders/order.access');
const orderSvc = require('../orders/order.service');
const { OperationsRepository } = require('./operations.repository');

class OperationsService {
  constructor() {
    this.repo = new OperationsRepository();
  }

  async listOffers(query, user, tenantScope) {
    const lq = parseListQuery(query, {});
    const where = { ...lq.where };
    if (tenantScope.type === 'provider' && tenantScope.providerId) {
      where.providerId = tenantScope.providerId;
    } else if (tenantScope.type === 'self') {
      where.order = { requesterId: user.id };
    } else if (tenantScope.type === 'assignment') {
      where.id = '___none___';
    }
    const { rows, total } = await this.repo.listOffers(where, lq.orderBy, lq.skip, lq.take);
    return { rows, total, page: lq.page, limit: lq.limit };
  }

  async createOffer(body, user, tenantScope, app) {
    const providerId = tenantScope.providerId;
    if (!providerId) throw AppError.forbidden('Provider context required');
    if (Number(body.price) <= 0) throw AppError.badRequest('Offer price must be greater than zero');
    if (body.validUntil && new Date(body.validUntil) <= new Date()) {
      throw AppError.badRequest('Offer validity date must be in the future');
    }

    const order = await this.repo.findOrderById(body.orderId);
    if (!order) throw AppError.notFound('Order not found');
    if (!['published_for_offers', 'offer_received'].includes(order.status)) {
      throw AppError.unprocessable('Order not accepting offers');
    }

    const provider = await this.repo.findProviderById(providerId);
    if (!provider?.isAcceptingOrders) {
      throw AppError.unprocessable('Provider not accepting orders');
    }

    const offer = await this.repo.createOffer({
      orderId: body.orderId,
      providerId,
      price: body.price,
      estimatedDuration: body.estimatedDuration,
      notes: body.notes,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      createdBy: user.id,
    });

    if (order.status === 'published_for_offers') {
      await this.repo.updateOrder(order.id, { status: 'offer_received', updatedBy: user.id });
      await this.repo.createOrderStatusHistory({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'offer_received',
        changedBy: user.id,
        notes: 'Offer received',
      });
    }

    const io = getIo(app);
    emitOrder(io, order.id, EVENTS.OFFER_NEW, { offerId: offer.id });
    emitProvider(io, providerId, EVENTS.OFFER_NEW, { offerId: offer.id });
    await this.repo.createNotification({
      userId: order.requesterId,
      title: 'New offer',
      body: `Provider submitted an offer on order ${order.orderNumber}`,
      type: 'info',
      data: { orderId: order.id, offerId: offer.id },
    });

    return offer;
  }

  async getOffer(id, user, tenantScope) {
    const offer = await this.repo.findOfferById(id, { order: true, provider: true });
    if (!offer) throw AppError.notFound();
    this.assertOfferScope(offer, user, tenantScope);
    return offer;
  }

  async updateOffer(id, body, tenantScope) {
    const offer = await this.repo.findOfferById(id);
    if (!offer || offer.status !== 'pending') throw AppError.unprocessable('Cannot update');
    this.assertProviderOfferScope(offer, tenantScope);
    return this.repo.updateOffer(id, body);
  }

  async withdrawOffer(id, user, tenantScope) {
    const offer = await this.repo.findOfferById(id);
    if (!offer) throw AppError.notFound();
    this.assertProviderOfferScope(offer, tenantScope);
    if (offer.status !== 'pending') throw AppError.unprocessable();
    await this.repo.updateOffer(id, {
      status: 'withdrawn',
      respondedAt: new Date(),
      respondedBy: user.id,
    });
  }

  async acceptOffer(id, user, tenantScope, app) {
    const offer = await this.repo.findOfferById(id, { order: true });
    if (!offer || offer.status !== 'pending') throw AppError.unprocessable();
    const order = offer.order;
    await orderAccess.assertCanViewOrder(user, tenantScope, order.id);
    if (order.requesterId !== user.id && tenantScope.type === 'self') throw AppError.forbidden();

    const updated = await this.repo.acceptOffer(offer, user.id);
    const io = getIo(app);
    emitOrder(io, order.id, EVENTS.OFFER_ACCEPTED, { offerId: offer.id });
    emitProvider(io, offer.providerId, EVENTS.OFFER_ACCEPTED, { offerId: offer.id });
    return updated;
  }

  async rejectOffer(id, user, tenantScope, app) {
    const offer = await this.repo.findOfferById(id, { order: true });
    if (!offer) throw AppError.notFound();
    await orderAccess.assertCanViewOrder(user, tenantScope, offer.orderId);
    await this.repo.updateOffer(offer.id, {
      status: 'rejected',
      respondedAt: new Date(),
      respondedBy: user.id,
    });
    const io = getIo(app);
    emitOrder(io, offer.orderId, EVENTS.OFFER_REJECTED, { offerId: offer.id });
  }

  async listAssignments(query, user, tenantScope) {
    const lq = parseListQuery(query, {});
    const where = { ...lq.where };
    if (tenantScope.type === 'provider' && tenantScope.providerId) {
      where.providerId = tenantScope.providerId;
    }
    if (tenantScope.type === 'assignment') {
      const drivers = await this.repo.findProviderDriversByUser(user.id);
      where.driverId = { in: drivers.map((d) => d.id) };
    }
    const { rows, total } = await this.repo.listAssignments(where, lq.orderBy, lq.skip, lq.take);
    return { rows, total, page: lq.page, limit: lq.limit };
  }

  async createAssignment(body, user, tenantScope, req) {
    return orderSvc.assignOrder(body.orderId, body, user, tenantScope, req);
  }

  async getAssignment(id) {
    const assignment = await this.repo.findAssignmentById(id);
    if (!assignment) throw AppError.notFound();
    return assignment;
  }

  async updateAssignment(id, body) {
    return this.repo.updateAssignment(id, {
      status: body.status,
      notes: body.notes,
      acceptedAt: body.status === 'accepted' ? new Date() : undefined,
      completedAt: body.status === 'completed' ? new Date() : undefined,
    });
  }

  async cancelAssignment(id) {
    await this.repo.updateAssignment(id, { status: 'canceled' });
  }

  async listOrderItems(orderId, user, tenantScope) {
    if (!orderId) throw AppError.badRequest('orderId required');
    await orderAccess.assertCanViewOrder(user, tenantScope, orderId);
    return this.repo.listOrderItems(orderId);
  }

  async createOrderItem(body, user, tenantScope) {
    await orderAccess.assertCanViewOrder(user, tenantScope, body.orderId);
    return this.repo.createOrderItem(body);
  }

  async updateOrderItem(id, body, user, tenantScope) {
    const existing = await this.repo.findOrderItemById(id);
    if (!existing) throw AppError.notFound();
    await orderAccess.assertCanViewOrder(user, tenantScope, existing.orderId);
    return this.repo.updateOrderItem(id, body);
  }

  async deleteOrderItem(id, user, tenantScope) {
    const existing = await this.repo.findOrderItemById(id);
    if (!existing) throw AppError.notFound();
    await orderAccess.assertCanViewOrder(user, tenantScope, existing.orderId);
    await this.repo.deleteOrderItem(id);
  }

  async getOrderItem(id, user, tenantScope) {
    const item = await this.repo.findOrderItemById(id);
    if (!item) throw AppError.notFound();
    await orderAccess.assertCanViewOrder(user, tenantScope, item.orderId);
    return item;
  }

  async listTracking(orderId, assignmentId, user, tenantScope) {
    await orderAccess.assertCanViewOrder(user, tenantScope, orderId);
    const assignment = await this.resolveAssignmentForOrder(orderId, assignmentId);
    const events = await this.repo.listTrackingEvents(assignment.id, { createdAt: 'desc' }, 200);
    return { assignmentId: assignment.id, events };
  }

  async listTrackingHistory(orderId, assignmentId, user, tenantScope) {
    await orderAccess.assertCanViewOrder(user, tenantScope, orderId);
    const assignment = await this.resolveAssignmentForOrder(orderId, assignmentId);
    return this.repo.listTrackingEvents(assignment.id, { createdAt: 'asc' });
  }

  async createTrackingEvent(orderId, body, user, tenantScope, app) {
    await orderAccess.assertCanViewOrder(user, tenantScope, orderId);
    const assignment = await this.resolveAssignmentForOrder(orderId, body.assignmentId);
    const event = await this.repo.createTrackingEvent({
      assignmentId: assignment.id,
      eventType: body.eventType,
      latitude: body.latitude,
      longitude: body.longitude,
      data: body.data || undefined,
    });
    const io = getIo(app);
    emitOrder(io, orderId, EVENTS.TRACKING_LOCATION, { event });
    return event;
  }

  async createLocationEvent(orderId, body, user, tenantScope, app) {
    return this.createTrackingEvent(
      orderId,
      { ...body, eventType: 'location' },
      user,
      tenantScope,
      app
    );
  }

  async listDeliveryProofs(orderId, user, tenantScope) {
    await orderAccess.assertCanViewOrder(user, tenantScope, orderId);
    return this.repo.listDeliveryProofs(orderId);
  }

  async createDeliveryProof(orderId, body, user, tenantScope) {
    await orderAccess.assertCanViewOrder(user, tenantScope, orderId);
    return this.repo.createDeliveryProof({
      orderId,
      type: body.type,
      fileName: body.fileName,
      filePath: body.filePath,
      mimeType: body.mimeType,
      notes: body.notes,
      capturedBy: user.id,
    });
  }

  async updateDeliveryProof(id, body) {
    return this.repo.updateDeliveryProof(id, { notes: body.notes });
  }

  async resolveAssignmentForOrder(orderId, assignmentId) {
    const assignment = await this.repo.findAssignmentForOrder(orderId, assignmentId);
    if (!assignment) {
      throw AppError.notFound(assignmentId ? 'Assignment not found' : 'No assignment for order');
    }
    return assignment;
  }

  assertProviderOfferScope(offer, tenantScope) {
    if (tenantScope.type === 'provider' && offer.providerId !== tenantScope.providerId) {
      throw AppError.forbidden();
    }
  }

  assertOfferScope(offer, user, tenantScope) {
    if (tenantScope.type === 'global') return;
    if (tenantScope.type === 'provider' && offer.providerId === tenantScope.providerId) return;
    if (tenantScope.type === 'self' && offer.order?.requesterId === user.id) return;
    throw AppError.forbidden();
  }
}

module.exports = new OperationsService();
