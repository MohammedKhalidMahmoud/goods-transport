const { Router } = require('express');
const Joi = require('joi');
const { prisma } = require('../../lib/prisma');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { success, paginated } = require('../../utils/response');
const { PERMISSIONS } = require('../../constants/permissions');
const { AppError } = require('../../utils/AppError');
const { parseListQuery } = require('../../lib/listQuery');
const orderAccess = require('../orders/order.access');
const { getIo, emitOrder, emitProvider, EVENTS } = require('../../lib/socketEmitter');

const router = Router();
const t = [authenticate, resolveTenantScope];

async function appendHistoryLocal(orderId, from, to, userId, notes) {
  await prisma.orderStatusHistory.create({
    data: { orderId, fromStatus: from, toStatus: to, changedBy: userId, notes },
  });
}

// --- Offers ---
router.get('/offers', ...t, authorizePermissions(PERMISSIONS.OFFERS_READ, PERMISSIONS.OFFERS_READ_OWN), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    let w = { ...lq.where };
    if (req.tenantScope.type === 'provider' && req.tenantScope.providerId) {
      w.providerId = req.tenantScope.providerId;
    }
    const [total, rows] = await Promise.all([
      prisma.offer.count({ where: w }),
      prisma.offer.findMany({
        where: w,
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
        include: { order: true, provider: true },
      }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'Offers');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/offers',
  ...t,
  authorizePermissions(PERMISSIONS.OFFERS_CREATE),
  validate({
    body: Joi.object({
      orderId: Joi.string().uuid().required(),
      price: Joi.number().required(),
      estimatedDuration: Joi.string().allow('', null),
      notes: Joi.string().allow('', null),
      validUntil: Joi.date().iso().allow(null),
    }),
  }),
  async (req, res, next) => {
    try {
      const pid = req.tenantScope.providerId;
      if (!pid) throw AppError.forbidden('Provider context required');
      const order = await prisma.order.findFirst({
        where: { id: req.body.orderId, deletedAt: null },
      });
      if (!order) throw AppError.notFound('Order not found');
      if (!['published_for_offers', 'offer_received'].includes(order.status)) {
        throw AppError.unprocessable('Order not accepting offers');
      }
      const prov = await prisma.provider.findFirst({ where: { id: pid, deletedAt: null } });
      if (!prov?.isAcceptingOrders) throw AppError.unprocessable('Provider not accepting orders');
      const off = await prisma.offer.create({
        data: {
          orderId: req.body.orderId,
          providerId: pid,
          price: req.body.price,
          estimatedDuration: req.body.estimatedDuration,
          notes: req.body.notes,
          validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
          createdBy: req.user.id,
        },
      });
      let nextStatus = order.status;
      if (order.status === 'published_for_offers') {
        nextStatus = 'offer_received';
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'offer_received', updatedBy: req.user.id },
        });
        await appendHistoryLocal(order.id, order.status, 'offer_received', req.user.id, 'Offer received');
      }
      const io = getIo(req.app);
      emitOrder(io, order.id, EVENTS.OFFER_NEW, { offerId: off.id });
      emitProvider(io, pid, EVENTS.OFFER_NEW, { offerId: off.id });
      await prisma.notification.create({
        data: {
          userId: order.requesterId,
          title: 'New offer',
          body: `Provider submitted an offer on order ${order.orderNumber}`,
          type: 'info',
          data: { orderId: order.id, offerId: off.id },
        },
      });
      return success(res, off, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/offers/:id', ...t, authorizePermissions(PERMISSIONS.OFFERS_READ, PERMISSIONS.OFFERS_READ_OWN), async (req, res, next) => {
  try {
    const off = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { order: true, provider: true },
    });
    if (!off) throw AppError.notFound();
    if (req.tenantScope.type === 'provider' && off.providerId !== req.tenantScope.providerId) throw AppError.forbidden();
    return success(res, off);
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/offers/:id',
  ...t,
  authorizePermissions(PERMISSIONS.OFFERS_CREATE),
  validate({
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({
      price: Joi.number(),
      notes: Joi.string().allow('', null),
      validUntil: Joi.date().iso().allow(null),
    }),
  }),
  async (req, res, next) => {
    try {
      const off = await prisma.offer.findUnique({ where: { id: req.params.id } });
      if (!off || off.status !== 'pending') throw AppError.unprocessable('Cannot update');
      if (req.tenantScope.type === 'provider' && off.providerId !== req.tenantScope.providerId) throw AppError.forbidden();
      const u = await prisma.offer.update({ where: { id: req.params.id }, data: req.body });
      return success(res, u);
    } catch (e) {
      next(e);
    }
  }
);

router.delete('/offers/:id', ...t, authorizePermissions(PERMISSIONS.OFFERS_WITHDRAW), async (req, res, next) => {
  try {
    const off = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!off) throw AppError.notFound();
    if (req.tenantScope.type === 'provider' && off.providerId !== req.tenantScope.providerId) throw AppError.forbidden();
    if (off.status !== 'pending') throw AppError.unprocessable();
    await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: 'withdrawn', respondedAt: new Date(), respondedBy: req.user.id },
    });
    return success(res, null, 'Withdrawn');
  } catch (e) {
    next(e);
  }
});

router.post('/offers/:id/accept', ...t, authorizePermissions(PERMISSIONS.OFFERS_ACCEPT), async (req, res, next) => {
  try {
    const off = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { order: true } });
    if (!off || off.status !== 'pending') throw AppError.unprocessable();
    const order = off.order;
    await orderAccess.assertCanViewOrder(req.user, req.tenantScope, order.id);
    if (order.requesterId !== req.user.id && req.tenantScope.type === 'self') throw AppError.forbidden();
    await prisma.$transaction(async (tx) => {
      await tx.offer.updateMany({
        where: { orderId: order.id, id: { not: off.id }, status: 'pending' },
        data: { status: 'expired', respondedAt: new Date(), respondedBy: req.user.id },
      });
      await tx.offer.update({
        where: { id: off.id },
        data: { status: 'accepted', respondedAt: new Date(), respondedBy: req.user.id },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'offer_accepted', finalPrice: off.price, updatedBy: req.user.id },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'offer_accepted',
          changedBy: req.user.id,
          notes: 'Offer accepted',
        },
      });
    });
    const io = getIo(req.app);
    emitOrder(io, order.id, EVENTS.OFFER_ACCEPTED, { offerId: off.id });
    emitProvider(io, off.providerId, EVENTS.OFFER_ACCEPTED, { offerId: off.id });
    return success(res, await prisma.offer.findUnique({ where: { id: off.id } }));
  } catch (e) {
    next(e);
  }
});

router.post(
  '/offers/:id/reject',
  ...t,
  authorizePermissions(PERMISSIONS.OFFERS_REJECT),
  async (req, res, next) => {
    try {
      const off = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { order: true } });
      if (!off) throw AppError.notFound();
      await orderAccess.assertCanViewOrder(req.user, req.tenantScope, off.orderId);
      await prisma.offer.update({
        where: { id: off.id },
        data: { status: 'rejected', respondedAt: new Date(), respondedBy: req.user.id },
      });
      const io = getIo(req.app);
      emitOrder(io, off.orderId, EVENTS.OFFER_REJECTED, { offerId: off.id });
      return success(res, null, 'Rejected');
    } catch (e) {
      next(e);
    }
  }
);

router.post('/offers/:id/withdraw', ...t, authorizePermissions(PERMISSIONS.OFFERS_WITHDRAW), async (req, res, next) => {
  try {
    const off = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!off) throw AppError.notFound();
    if (req.tenantScope.type === 'provider' && off.providerId !== req.tenantScope.providerId) throw AppError.forbidden();
    await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: 'withdrawn', respondedAt: new Date(), respondedBy: req.user.id },
    });
    return success(res, null, 'Withdrawn');
  } catch (e) {
    next(e);
  }
});

// --- Assignments ---
router.get('/assignments', ...t, authorizePermissions(PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_READ_PROVIDER, PERMISSIONS.ASSIGNMENTS_READ_OWN), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const w = { ...lq.where };
    if (req.tenantScope.type === 'provider' && req.tenantScope.providerId) {
      w.providerId = req.tenantScope.providerId;
    }
    if (req.tenantScope.type === 'assignment') {
      const drivers = await prisma.providerDriver.findMany({
        where: { userId: req.user.id },
        select: { id: true },
      });
      w.driverId = { in: drivers.map((d) => d.id) };
    }
    const [total, rows] = await Promise.all([
      prisma.assignment.count({ where: w }),
      prisma.assignment.findMany({
        where: w,
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
        include: { order: true, provider: true, driver: true },
      }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'Assignments');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/assignments',
  ...t,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_CREATE),
  validate({
    body: Joi.object({
      orderId: Joi.string().uuid().required(),
      providerId: Joi.string().uuid().required(),
      driverId: Joi.string().uuid().allow(null),
    }),
  }),
  async (req, res, next) => {
    try {
      const orderSvc = require('../orders/order.service');
      const a = await orderSvc.assignOrder(req.body.orderId, req.body, req.user, req.tenantScope, req);
      return success(res, a, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/assignments/:id', ...t, authorizePermissions(PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_READ_PROVIDER, PERMISSIONS.ASSIGNMENTS_READ_OWN), async (req, res, next) => {
  try {
    const a = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: { order: true, provider: true, driver: true },
    });
    if (!a) throw AppError.notFound();
    return success(res, a);
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/assignments/:id',
  ...t,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS),
  validate({
    body: Joi.object({
      status: Joi.string().valid('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'canceled'),
      notes: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      const a = await prisma.assignment.update({
        where: { id: req.params.id },
        data: {
          status: req.body.status,
          notes: req.body.notes,
          acceptedAt: req.body.status === 'accepted' ? new Date() : undefined,
          completedAt: req.body.status === 'completed' ? new Date() : undefined,
        },
      });
      return success(res, a);
    } catch (e) {
      next(e);
    }
  }
);

router.delete('/assignments/:id', ...t, authorizePermissions(PERMISSIONS.ASSIGNMENTS_CREATE), async (req, res, next) => {
  try {
    await prisma.assignment.update({
      where: { id: req.params.id },
      data: { status: 'canceled' },
    });
    return success(res, null, 'Canceled');
  } catch (e) {
    next(e);
  }
});

// --- Order items (standalone) ---
router.get('/order-items', ...t, authorizePermissions(PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_READ_OWN, PERMISSIONS.ORDERS_READ_COMPANY), async (req, res, next) => {
  try {
    if (!req.query.orderId) throw AppError.badRequest('orderId required');
    await orderAccess.assertCanViewOrder(req.user, req.tenantScope, req.query.orderId);
    const rows = await prisma.orderItem.findMany({ where: { orderId: req.query.orderId } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/order-items',
  ...t,
  authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE),
  validate({
    body: Joi.object({
      orderId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      quantity: Joi.number().integer().min(1),
      description: Joi.string().allow('', null),
      isFragile: Joi.boolean(),
      weight: Joi.number(),
      dimensions: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      await orderAccess.assertCanViewOrder(req.user, req.tenantScope, req.body.orderId);
      const it = await prisma.orderItem.create({ data: req.body });
      return success(res, it, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/order-items/:id',
  ...t,
  authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE),
  validate({
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({
      name: Joi.string(),
      quantity: Joi.number().integer(),
      description: Joi.string().allow('', null),
      isFragile: Joi.boolean(),
      weight: Joi.number(),
      dimensions: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      const existing = await prisma.orderItem.findUnique({ where: { id: req.params.id } });
      if (!existing) throw AppError.notFound();
      await orderAccess.assertCanViewOrder(req.user, req.tenantScope, existing.orderId);
      const it = await prisma.orderItem.update({ where: { id: req.params.id }, data: req.body });
      return success(res, it);
    } catch (e) {
      next(e);
    }
  }
);

router.delete('/order-items/:id', ...t, authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE), async (req, res, next) => {
  try {
    const existing = await prisma.orderItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw AppError.notFound();
    await orderAccess.assertCanViewOrder(req.user, req.tenantScope, existing.orderId);
    await prisma.orderItem.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/order-items/:id', ...t, authorizePermissions(PERMISSIONS.ORDERS_READ), async (req, res, next) => {
  try {
    const it = await prisma.orderItem.findUnique({ where: { id: req.params.id } });
    if (!it) throw AppError.notFound();
    await orderAccess.assertCanViewOrder(req.user, req.tenantScope, it.orderId);
    return success(res, it);
  } catch (e) {
    next(e);
  }
});

// --- Tracking ---
async function resolveAssignmentForOrder(orderId, assignmentId) {
  if (assignmentId) {
    const a = await prisma.assignment.findFirst({ where: { id: assignmentId, orderId } });
    if (!a) throw AppError.notFound('Assignment not found');
    return a;
  }
  const a = await prisma.assignment.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
  if (!a) throw AppError.notFound('No assignment for order');
  return a;
}

router.get('/tracking/:orderId', ...t, async (req, res, next) => {
  try {
    await orderAccess.assertCanViewOrder(req.user, req.tenantScope, req.params.orderId);
    const a = await resolveAssignmentForOrder(req.params.orderId, req.query.assignmentId);
    const events = await prisma.trackingEvent.findMany({
      where: { assignmentId: a.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return success(res, { assignmentId: a.id, events });
  } catch (e) {
    next(e);
  }
});

router.get('/tracking/:orderId/history', ...t, async (req, res, next) => {
  try {
    await orderAccess.assertCanViewOrder(req.user, req.tenantScope, req.params.orderId);
    const a = await resolveAssignmentForOrder(req.params.orderId, req.query.assignmentId);
    const events = await prisma.trackingEvent.findMany({
      where: { assignmentId: a.id },
      orderBy: { createdAt: 'asc' },
    });
    return success(res, events);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/tracking/:orderId/events',
  ...t,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS),
  validate({
    body: Joi.object({
      eventType: Joi.string().required(),
      latitude: Joi.number().allow(null),
      longitude: Joi.number().allow(null),
      data: Joi.object().unknown(true).allow(null),
      assignmentId: Joi.string().uuid().allow(null),
    }),
  }),
  async (req, res, next) => {
    try {
      await orderAccess.assertCanViewOrder(req.user, req.tenantScope, req.params.orderId);
      const a = await resolveAssignmentForOrder(req.params.orderId, req.body.assignmentId);
      const ev = await prisma.trackingEvent.create({
        data: {
          assignmentId: a.id,
          eventType: req.body.eventType,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          data: req.body.data || undefined,
        },
      });
      const io = getIo(req.app);
      emitOrder(io, req.params.orderId, EVENTS.TRACKING_LOCATION, { event: ev });
      return success(res, ev, 'Recorded', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/tracking/:orderId/location',
  ...t,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS),
  validate({
    body: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      assignmentId: Joi.string().uuid().allow(null),
    }),
  }),
  async (req, res, next) => {
    try {
      await orderAccess.assertCanViewOrder(req.user, req.tenantScope, req.params.orderId);
      const a = await resolveAssignmentForOrder(req.params.orderId, req.body.assignmentId);
      const ev = await prisma.trackingEvent.create({
        data: {
          assignmentId: a.id,
          eventType: 'location',
          latitude: req.body.latitude,
          longitude: req.body.longitude,
        },
      });
      const io = getIo(req.app);
      emitOrder(io, req.params.orderId, EVENTS.TRACKING_LOCATION, { event: ev });
      return success(res, ev, 'Recorded', 201);
    } catch (e) {
      next(e);
    }
  }
);

// --- Delivery proofs ---
router.get('/delivery-proofs/:orderId', ...t, async (req, res, next) => {
  try {
    await orderAccess.assertCanViewOrder(req.user, req.tenantScope, req.params.orderId);
    const rows = await prisma.deliveryProof.findMany({ where: { orderId: req.params.orderId } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/delivery-proofs/:orderId',
  ...t,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS),
  validate({
    body: Joi.object({
      type: Joi.string().valid('photo', 'signature', 'confirmation').required(),
      fileName: Joi.string().required(),
      filePath: Joi.string().required(),
      mimeType: Joi.string().required(),
      notes: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      await orderAccess.assertCanViewOrder(req.user, req.tenantScope, req.params.orderId);
      const p = await prisma.deliveryProof.create({
        data: {
          orderId: req.params.orderId,
          type: req.body.type,
          fileName: req.body.fileName,
          filePath: req.body.filePath,
          mimeType: req.body.mimeType,
          notes: req.body.notes,
          capturedBy: req.user.id,
        },
      });
      return success(res, p, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/delivery-proofs/:id',
  ...t,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS),
  validate({
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({ notes: Joi.string().allow('', null) }),
  }),
  async (req, res, next) => {
    try {
      const p = await prisma.deliveryProof.update({
        where: { id: req.params.id },
        data: { notes: req.body.notes },
      });
      return success(res, p);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
