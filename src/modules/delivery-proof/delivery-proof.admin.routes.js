const { Router } = require('express');
const Joi = require('joi');
const deliveryProofController = require('./delivery-proof.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];
const deliveryProofCreateSchema = { body: Joi.object({ type: Joi.string().valid('photo', 'signature', 'confirmation').required(), fileName: Joi.string().required(), filePath: Joi.string().required(), mimeType: Joi.string().required(), notes: Joi.string().allow('', null) }) };
const deliveryProofUpdateSchema = { params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ notes: Joi.string().allow('', null) }) };

router.get('/delivery-proofs/:orderId', ...tenant, deliveryProofController.listDeliveryProofs);
router.post('/delivery-proofs/:orderId', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(deliveryProofCreateSchema), deliveryProofController.createDeliveryProof);
router.patch('/delivery-proofs/:id', ...tenant, authorizePermissions(PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS), validate(deliveryProofUpdateSchema), deliveryProofController.updateDeliveryProof);

module.exports = router;
