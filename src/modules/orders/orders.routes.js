const { Router } = require('express');
const Joi = require('joi');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const ordersController = require('./orders.controller');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

const orderCreate = Joi.object({
  serviceId: Joi.string().uuid().required(),
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

const idParam = Joi.object({ id: Joi.string().uuid().required() });

router.get(
  '/orders',
  ...tenant,
  authorizePermissions(
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_READ_OWN,
    PERMISSIONS.ORDERS_READ_PROVIDER
  ),
  ordersController.listOrders
);

router.post(
  '/orders',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_CREATE),
  validate({ body: orderCreate }),
  ordersController.createOrder
);

router.get(
  '/orders/:id',
  ...tenant,
  authorizePermissions(
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_READ_OWN,
    PERMISSIONS.ORDERS_READ_PROVIDER
  ),
  ordersController.getOrder
);

router.get('/orders/:id/timeline', ...tenant, ordersController.getTimeline);

router.get('/orders/:id/attachments', ...tenant, ordersController.listAttachments);

router.post(
  '/orders/:id/attachments',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE),
  validate({
    params: idParam,
    body: Joi.object({
      fileName: Joi.string().required(),
      originalName: Joi.string().required(),
      filePath: Joi.string().required(),
      mimeType: Joi.string().required(),
      fileSize: Joi.number().integer().required(),
    }),
  }),
  ordersController.createAttachment
);

router.post('/orders/:id/submit', ...tenant, authorizePermissions(PERMISSIONS.ORDERS_SUBMIT), ordersController.submitOrder);

router.post(
  '/orders/:id/cancel',
  ...tenant,
  authorizePermissions(PERMISSIONS.ORDERS_CANCEL),
  validate({ body: Joi.object({ reason: Joi.string().required() }) }),
  ordersController.cancelOrder
);

router.post(
  '/orders/:id/accept',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS),
  validate({
    params: idParam,
    body: Joi.object({
      driverId: Joi.string().uuid().allow(null),
      notes: Joi.string().allow('', null),
    }),
  }),
  ordersController.acceptAssignedOrder
);

router.post(
  '/orders/:id/reject',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS),
  validate({
    params: idParam,
    body: Joi.object({
      reason: Joi.string().allow('', null),
    }),
  }),
  ordersController.rejectAssignedOrder
);

router.post(
  '/orders/:id/start',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS, PERMISSIONS.ORDERS_READ_PROVIDER),
  ordersController.transitionOrder('en_route_to_pickup')
);
router.post(
  '/orders/:id/arrive-pickup',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS, PERMISSIONS.ORDERS_READ_PROVIDER),
  ordersController.transitionOrder('arrived_pickup')
);
router.post(
  '/orders/:id/pickup',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS, PERMISSIONS.ORDERS_READ_PROVIDER),
  ordersController.transitionOrder('picked_up')
);
router.post(
  '/orders/:id/arrive-dropoff',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS, PERMISSIONS.ORDERS_READ_PROVIDER),
  ordersController.transitionOrder('arrived_dropoff')
);
router.post(
  '/orders/:id/deliver',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS, PERMISSIONS.ORDERS_READ_PROVIDER),
  ordersController.transitionOrder('delivered')
);
router.post(
  '/orders/:id/complete',
  ...tenant,
  authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS, PERMISSIONS.ORDERS_READ_PROVIDER),
  ordersController.transitionOrder('completed')
);

module.exports = router;
