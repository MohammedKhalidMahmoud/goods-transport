const { Router } = require('express');
const Joi = require('joi');
const notificationsController = require('./notifications.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { ROLES } = require('../../constants/roles');

const router = Router();

router.post('/notifications', authenticateDashboard, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN, ROLES.SUPPORT_ADMIN), validate({ body: Joi.object({ userId: Joi.string().uuid().required(), title: Joi.string().required(), body: Joi.string().required(), type: Joi.string() }) }), notificationsController.createNotification);

module.exports = router;
