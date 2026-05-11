const { Router } = require('express');
const settlementsController = require('./settlements.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

router.get('/settlements', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE, PERMISSIONS.SETTLEMENTS_READ_OWN), settlementsController.listSettlements);
router.get('/settlements/:id', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE, PERMISSIONS.SETTLEMENTS_READ_OWN), settlementsController.getSettlement);

module.exports = router;
