const { Router } = require('express');
const Joi = require('joi');
const operationsController = require('./operations.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];

const offerCreateSchema = {
  body: Joi.object({
    orderId: Joi.string().uuid().required(),
    price: Joi.number().required(),
    estimatedDuration: Joi.string().allow('', null),
    notes: Joi.string().allow('', null),
    validUntil: Joi.date().iso().allow(null),
  }),
};

const offerUpdateSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    price: Joi.number(),
    notes: Joi.string().allow('', null),
    validUntil: Joi.date().iso().allow(null),
  }),
};

const assignmentCreateSchema = {
  body: Joi.object({
    orderId: Joi.string().uuid().required(),
    providerId: Joi.string().uuid().required(),
    driverId: Joi.string().uuid().allow(null),
  }),
};

const assignmentUpdateSchema = {
  body: Joi.object({
    status: Joi.string().valid('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'canceled'),
    notes: Joi.string().allow('', null),
  }),
};

const orderItemCreateSchema = {
  body: Joi.object({
    orderId: Joi.string().uuid().required(),
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1),
    description: Joi.string().allow('', null),
    isFragile: Joi.boolean(),
    weight: Joi.number(),
    dimensions: Joi.string().allow('', null),
  }),
};

const orderItemUpdateSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    name: Joi.string(),
    quantity: Joi.number().integer(),
    description: Joi.string().allow('', null),
    isFragile: Joi.boolean(),
    weight: Joi.number(),
    dimensions: Joi.string().allow('', null),
  }),
};

const trackingEventSchema = {
  body: Joi.object({
    eventType: Joi.string().required(),
    latitude: Joi.number().allow(null),
    longitude: Joi.number().allow(null),
    data: Joi.object().unknown(true).allow(null),
    assignmentId: Joi.string().uuid().allow(null),
  }),
};

const trackingLocationSchema = {
  body: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    assignmentId: Joi.string().uuid().allow(null),
  }),
};

const deliveryProofCreateSchema = {
  body: Joi.object({
    type: Joi.string().valid('photo', 'signature', 'confirmation').required(),
    fileName: Joi.string().required(),
    filePath: Joi.string().required(),
    mimeType: Joi.string().required(),
    notes: Joi.string().allow('', null),
  }),
};

const deliveryProofUpdateSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({ notes: Joi.string().allow('', null) }),
};

router.get('/offers', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_READ, PERMISSIONS.OFFERS_READ_OWN), operationsController.listOffers);
router.post('/offers', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_CREATE), validate(offerCreateSchema), operationsController.createOffer);
router.get('/offers/:id', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_READ, PERMISSIONS.OFFERS_READ_OWN), operationsController.getOffer);
router.patch('/offers/:id', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_CREATE), validate(offerUpdateSchema), operationsController.updateOffer);
router.delete('/offers/:id', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_WITHDRAW), operationsController.withdrawOffer);
router.post('/offers/:id/accept', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_ACCEPT), operationsController.acceptOffer);
router.post('/offers/:id/reject', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_REJECT), operationsController.rejectOffer);
router.post('/offers/:id/withdraw', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_WITHDRAW), operationsController.withdrawOffer);

router.get('/assignments', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_READ_PROVIDER, PERMISSIONS.ASSIGNMENTS_READ_OWN), operationsController.listAssignments);
router.post('/assignments', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_CREATE), validate(assignmentCreateSchema), operationsController.createAssignment);
router.get('/assignments/:id', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_READ_PROVIDER, PERMISSIONS.ASSIGNMENTS_READ_OWN), operationsController.getAssignment);
router.patch('/assignments/:id', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(assignmentUpdateSchema), operationsController.updateAssignment);
router.delete('/assignments/:id', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_CREATE), operationsController.cancelAssignment);

router.get('/order-items', ...tenant, authorizePermissions(PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_READ_OWN, PERMISSIONS.ORDERS_READ_COMPANY), operationsController.listOrderItems);
router.post('/order-items', ...tenant, authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE), validate(orderItemCreateSchema), operationsController.createOrderItem);
router.patch('/order-items/:id', ...tenant, authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE), validate(orderItemUpdateSchema), operationsController.updateOrderItem);
router.delete('/order-items/:id', ...tenant, authorizePermissions(PERMISSIONS.ORDERS_UPDATE_OWN, PERMISSIONS.ORDERS_UPDATE), operationsController.deleteOrderItem);
router.get('/order-items/:id', ...tenant, authorizePermissions(PERMISSIONS.ORDERS_READ), operationsController.getOrderItem);

router.get('/tracking/:orderId', ...tenant, operationsController.listTracking);
router.get('/tracking/:orderId/history', ...tenant, operationsController.listTrackingHistory);
router.post('/tracking/:orderId/events', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(trackingEventSchema), operationsController.createTrackingEvent);
router.post('/tracking/:orderId/location', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(trackingLocationSchema), operationsController.createLocationEvent);

router.get('/delivery-proofs/:orderId', ...tenant, operationsController.listDeliveryProofs);
router.post('/delivery-proofs/:orderId', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(deliveryProofCreateSchema), operationsController.createDeliveryProof);
router.patch('/delivery-proofs/:id', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(deliveryProofUpdateSchema), operationsController.updateDeliveryProof);

module.exports = router;
