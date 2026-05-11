const { Router } = require('express');
const Joi = require('joi');
const paymentsController = require('./payments.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

router.get('/payments', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ), paymentsController.listPayments);
router.post('/payments', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_CREATE), validate({ body: Joi.object({ invoiceId: Joi.string().uuid().required(), amount: Joi.number().required(), method: Joi.string().valid('cash', 'bank_transfer', 'online', 'wallet').required() }) }), paymentsController.createPayment);
router.get('/payments/:id', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ), paymentsController.getPayment);
router.patch('/payments/:id', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_CREATE), paymentsController.updatePayment);

module.exports = router;
