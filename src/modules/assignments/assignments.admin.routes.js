const { Router } = require('express');
const Joi = require('joi');
const assignmentsController = require('./assignments.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];
const assignmentCreateSchema = { body: Joi.object({ orderId: Joi.string().uuid().required(), providerId: Joi.string().uuid().required(), driverId: Joi.string().uuid().allow(null) }) };
const assignmentUpdateSchema = { body: Joi.object({ status: Joi.string().valid('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'canceled'), notes: Joi.string().allow('', null) }) };

router.get('/assignments', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_READ_PROVIDER, PERMISSIONS.ASSIGNMENTS_READ_OWN), assignmentsController.listAssignments);
router.post('/assignments', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_CREATE), validate(assignmentCreateSchema), assignmentsController.createAssignment);
router.get('/assignments/:id', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_READ_PROVIDER, PERMISSIONS.ASSIGNMENTS_READ_OWN), assignmentsController.getAssignment);
router.patch('/assignments/:id', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(assignmentUpdateSchema), assignmentsController.updateAssignment);
router.delete('/assignments/:id', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_CREATE), assignmentsController.cancelAssignment);

module.exports = router;
