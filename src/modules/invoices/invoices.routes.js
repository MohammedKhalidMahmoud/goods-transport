const { Router } = require('express');
const invoicesController = require('./invoices.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

router.get('/invoices', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_READ_OWN), invoicesController.listInvoices);
router.get('/invoices/:id', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_READ), invoicesController.getInvoice);

module.exports = router;
