const { Router } = require('express');
const paymentsController = require('./payments.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

router.get('/payments', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ), paymentsController.listPayments);
router.get('/payments/:id', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ), paymentsController.getPayment);

module.exports = router;
