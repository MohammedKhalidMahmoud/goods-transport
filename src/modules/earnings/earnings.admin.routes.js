const { Router } = require('express');
const earningsController = require('./earnings.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];

router.get('/earnings/reports', ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ANALYTICS_READ_PROVIDER), earningsController.listEarningsReports);
router.get('/earnings/reports/:id', ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ANALYTICS_READ_PROVIDER), earningsController.getEarningsReport);

module.exports = router;
