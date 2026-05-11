const { Router } = require('express');
const Joi = require('joi');
const offersController = require('./offers.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticate, resolveTenantScope];
const offerCreateSchema = { body: Joi.object({ orderId: Joi.string().uuid().required(), price: Joi.number().required(), estimatedDuration: Joi.string().allow('', null), notes: Joi.string().allow('', null), validUntil: Joi.date().iso().allow(null) }) };
const offerUpdateSchema = { params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ price: Joi.number(), notes: Joi.string().allow('', null), validUntil: Joi.date().iso().allow(null) }) };

router.get('/offers', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_READ, PERMISSIONS.OFFERS_READ_OWN), offersController.listOffers);
router.post('/offers', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_CREATE), validate(offerCreateSchema), offersController.createOffer);
router.get('/offers/:id', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_READ, PERMISSIONS.OFFERS_READ_OWN), offersController.getOffer);
router.patch('/offers/:id', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_CREATE), validate(offerUpdateSchema), offersController.updateOffer);
router.delete('/offers/:id', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_WITHDRAW), offersController.withdrawOffer);
router.post('/offers/:id/accept', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_ACCEPT), offersController.acceptOffer);
router.post('/offers/:id/reject', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_REJECT), offersController.rejectOffer);
router.post('/offers/:id/withdraw', ...tenant, authorizePermissions(PERMISSIONS.OFFERS_WITHDRAW), offersController.withdrawOffer);

module.exports = router;
