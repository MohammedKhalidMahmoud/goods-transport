const { Router } = require('express');
const Joi = require('joi');
const trackingController = require('./tracking.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];
const trackingEventSchema = { body: Joi.object({ eventType: Joi.string().required(), latitude: Joi.number().allow(null), longitude: Joi.number().allow(null), data: Joi.object().unknown(true).allow(null), assignmentId: Joi.string().uuid().allow(null) }) };
const trackingLocationSchema = { body: Joi.object({ latitude: Joi.number().required(), longitude: Joi.number().required(), assignmentId: Joi.string().uuid().allow(null) }) };

router.get('/tracking/:orderId', ...tenant, trackingController.listTracking);
router.get('/tracking/:orderId/history', ...tenant, trackingController.listTrackingHistory);
router.post('/tracking/:orderId/events', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(trackingEventSchema), trackingController.createTrackingEvent);
router.post('/tracking/:orderId/location', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(trackingLocationSchema), trackingController.createLocationEvent);

module.exports = router;
