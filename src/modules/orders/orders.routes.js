const { Router } = require('express');
const Joi = require('joi');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { success, paginated } = require('../../utils/response');
const { PERMISSIONS } = require('../../constants/permissions');
const orderSvc = require('./order.service');
const { prisma } = require('../../lib/prisma');

const router = Router();

const tenant = [authenticate, resolveTenantScope];

const orderCreate = Joi.object({
  sourceType: Joi.string().valid('individual', 'company'),
  serviceTypeId: Joi.string().uuid().required(),
  vehicleTypeId: Joi.string().uuid().allow(null),
  workerCount: Joi.number().integer().min(1),
  isFragile: Joi.boolean(),
  notes: Joi.string().allow('', null),
  scheduledDate: Joi.date().iso(),
  scheduledTimeSlot: Joi.string().allow('', null),
  estimatedPrice: Joi.number(),
  locations: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('pickup', 'dropoff').required(),
      addressLine: Joi.string().required(),
      city: Joi.string().required(),
      area: Joi.string().allow('', null),
      latitude: Joi.number(),
      longitude: Joi.number(),
      floor: Joi.number().integer(),
      unit: Joi.string().allow('', null),
      hasElevator: Joi.boolean(),
      contactName: Joi.string().allow('', null),
      contactPhone: Joi.string().allow('', null),
      notes: Joi.string().allow('', null),
    })
  ),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().integer().min(1),
      description: Joi.string().allow('', null),
      isFragile: Joi.boolean(),
      weight: Joi.number(),
      dimensions: Joi.string().allow('', null),
    })
  ),
});

router.get(
  '/orders',
  ...tenant,
  authorizePermissions(
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_READ_COMPANY,
    PERMISSIONS.ORDERS_READ_OWN,
    PERMISSIONS.ORDERS_READ_PROVIDER
  ),
  async (req, res, next) => {
    try {
      const { rows, total, page, limit } = await orderSvc.listOrders(req.query, req.user, req.tenantScope);
      return paginated(res, rows, { page, limit, total }, 'Orders');
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/orders',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_CREATE),
  validate({ body: orderCreate }),
  async (req, res, next) => {
    try {
      const o = await orderSvc.createOrder(req.body, req.user, req.tenantScope, req);
      return success(res, o, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/orders/:id',
  ...tenant,
  authorizePermissions(
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_READ_COMPANY,
    PERMISSIONS.ORDERS_READ_OWN,
    PERMISSIONS.ORDERS_READ_PROVIDER
  ),
  async (req, res, next) => {
    try {
      const o = await orderSvc.assertCanViewOrder(req.user, req.tenantScope, req.params.id);
      return success(res, o);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/orders/:id',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_UPDATE_OWN),
  validate({
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: orderCreate.fork(['serviceTypeId', 'locations', 'items'], (x) => x.optional()),
  }),
  async (req, res, next) => {
    try {
      const o = await orderSvc.updateOrder(req.params.id, req.body, req.user, req.tenantScope, req);
      return success(res, o, 'Updated');
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/orders/:id',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE),
  validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }),
  async (req, res, next) => {
    try {
      await orderSvc.softDeleteOrder(req.params.id, req.user, req.tenantScope, req);
      return success(res, null, 'Deleted');
    } catch (e) {
      next(e);
    }
  }
);

router.get('/orders/:id/timeline', ...tenant, async (req, res, next) => {
  try {
    await orderSvc.assertCanViewOrder(req.user, req.tenantScope, req.params.id);
    const rows = await prisma.orderStatusHistory.findMany({
      where: { orderId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.get('/orders/:id/attachments', ...tenant, async (req, res, next) => {
  try {
    await orderSvc.assertCanViewOrder(req.user, req.tenantScope, req.params.id);
    const rows = await prisma.orderAttachment.findMany({ where: { orderId: req.params.id } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/orders/:id/attachments',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE),
  validate({
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({
      fileName: Joi.string().required(),
      originalName: Joi.string().required(),
      filePath: Joi.string().required(),
      mimeType: Joi.string().required(),
      fileSize: Joi.number().integer().required(),
    }),
  }),
  async (req, res, next) => {
    try {
      await orderSvc.assertCanViewOrder(req.user, req.tenantScope, req.params.id);
      const a = await prisma.orderAttachment.create({
        data: {
          orderId: req.params.id,
          fileName: req.body.fileName,
          originalName: req.body.originalName,
          filePath: req.body.filePath,
          mimeType: req.body.mimeType,
          fileSize: req.body.fileSize,
          uploadedBy: req.user.id,
        },
      });
      return success(res, a, 'Uploaded', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.post('/orders/:id/submit', ...tenant, authorizePermissions(PERMISSIONS.ORDERS_SUBMIT), async (req, res, next) => {
  try {
    const o = await orderSvc.submitOrder(req.params.id, req.user, req.tenantScope, req);
    return success(res, o, 'Submitted');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/orders/:id/publish',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_READ_COMPANY),
  async (req, res, next) => {
    try {
      const o = await orderSvc.publishOrder(req.params.id, req.user, req.tenantScope, req);
      return success(res, o, 'Published');
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/orders/:id/cancel',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_CANCEL),
  validate({ body: Joi.object({ reason: Joi.string().required() }) }),
  async (req, res, next) => {
    try {
      const o = await orderSvc.cancelOrder(req.params.id, req.body, req.user, req.tenantScope, req);
      return success(res, o, 'Canceled');
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/orders/:id/assign',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_CREATE, PERMISSIONS.ORDERS_UPDATE),
  validate({
    body: Joi.object({
      providerId: Joi.string().uuid().required(),
      driverId: Joi.string().uuid().allow(null),
    }),
  }),
  async (req, res, next) => {
    try {
      const a = await orderSvc.assignOrder(req.params.id, req.body, req.user, req.tenantScope, req);
      return success(res, a, 'Assigned', 201);
    } catch (e) {
      next(e);
    }
  }
);

const trans = (path, status) => {
  router.post(path, ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS, PERMISSIONS.ORDERS_READ_PROVIDER), async (req, res, next) => {
    try {
      const o = await orderSvc.transitionSimple(req.params.id, status, req.user, req.tenantScope, req);
      return success(res, o);
    } catch (e) {
      next(e);
    }
  });
};

trans('/orders/:id/start', 'en_route_to_pickup');
trans('/orders/:id/arrive-pickup', 'arrived_pickup');
trans('/orders/:id/pickup', 'picked_up');
trans('/orders/:id/arrive-dropoff', 'arrived_dropoff');
trans('/orders/:id/deliver', 'delivered');
trans('/orders/:id/complete', 'completed');

module.exports = router;
