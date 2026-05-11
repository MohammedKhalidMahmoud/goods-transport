const { Router } = require('express');
const providersController = require('./providers.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

router.get('/provider-wallet', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_READ_OWN), providersController.getWallet);
router.get('/provider-earnings', ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ_PROVIDER, PERMISSIONS.SETTLEMENTS_READ_OWN), providersController.getEarnings);
router.get('/provider-settlements', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_READ_OWN), providersController.listSettlements);

module.exports = router;
