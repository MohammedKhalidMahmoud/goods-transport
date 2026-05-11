const { Router } = require('express');
const Joi = require('joi');
const settlementsController = require('./settlements.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];

router.get('/settlements', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE, PERMISSIONS.SETTLEMENTS_READ_OWN), settlementsController.listSettlements);
router.get('/settlements/:id', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE, PERMISSIONS.SETTLEMENTS_READ_OWN), settlementsController.getSettlement);
router.post('/settlements', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE), validate({ body: Joi.object({ providerId: Joi.string().uuid().required(), amount: Joi.number().required(), periodStart: Joi.date().iso().required(), periodEnd: Joi.date().iso().required(), currency: Joi.string(), reference: Joi.string().allow('', null) }) }), settlementsController.createSettlement);

module.exports = router;
