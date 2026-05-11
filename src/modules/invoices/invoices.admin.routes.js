const { Router } = require('express');
const Joi = require('joi');
const invoicesController = require('./invoices.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];

router.get('/invoices', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_READ_COMPANY, PERMISSIONS.INVOICES_READ_OWN), invoicesController.listInvoices);
router.post('/invoices', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_CREATE), validate({ body: Joi.object({ orderId: Joi.string().uuid().allow(null), companyId: Joi.string().uuid().allow(null), providerId: Joi.string().uuid().allow(null), subtotal: Joi.number(), taxAmount: Joi.number(), totalAmount: Joi.number(), currency: Joi.string(), dueDate: Joi.date().iso().allow(null), notes: Joi.string().allow('', null), items: Joi.array().items(Joi.object({ description: Joi.string().required(), quantity: Joi.number(), unitPrice: Joi.number().required(), amount: Joi.number().required() })) }) }), invoicesController.createInvoice);
router.get('/invoices/:id', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_READ_COMPANY), invoicesController.getInvoice);
router.patch('/invoices/:id', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_CREATE), invoicesController.updateInvoice);
router.delete('/invoices/:id', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_CREATE), invoicesController.deleteInvoice);
router.post('/invoices/:id/issue', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_CREATE), invoicesController.issueInvoice);
router.post('/invoices/:id/mark-paid', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_CREATE), validate({ body: Joi.object({ amount: Joi.number().required(), method: Joi.string().valid('cash', 'bank_transfer', 'online', 'wallet').required() }) }), invoicesController.markInvoicePaid);

module.exports = router;
