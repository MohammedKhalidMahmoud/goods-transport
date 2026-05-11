const { Router } = require('express');
const commissionsController = require('./commissions.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];

router.get('/commissions', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ, PERMISSIONS.ANALYTICS_READ), commissionsController.listCommissions);
router.get('/commissions/:id', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ, PERMISSIONS.ANALYTICS_READ), commissionsController.getCommission);

module.exports = router;
