const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./pricing-settings.controller');
const v = require('../master-data/master-data.validation');

const router = Router();
const read = [authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];
const write = [authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE)];
const patchOptional = (schema) => schema.fork(Object.keys(schema.describe().keys || {}), (key) => key.optional());

router.get('/pricing-settings', ...read, controller.list);
router.get('/pricing-settings/:id', ...read, validate({ params: v.idParam }), controller.get);
router.post('/pricing-settings', ...write, validate({ body: v.pricingBody }), controller.create);
router.patch('/pricing-settings/:id', ...write, validate({ params: v.idParam, body: patchOptional(v.pricingBody) }), controller.update);
router.delete('/pricing-settings/:id', ...write, validate({ params: v.idParam }), controller.remove);

module.exports = router;
