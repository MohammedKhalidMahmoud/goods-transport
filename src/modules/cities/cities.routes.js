const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./cities.controller');
const v = require('../master-data/master-data.validation');

const router = Router();
const read = [authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];
const write = [authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE)];
const patchOptional = (schema) => schema.fork(Object.keys(schema.describe().keys || {}), (key) => key.optional());

router.get('/cities', ...read, controller.list);
router.get('/cities/:id', ...read, validate({ params: v.idParam }), controller.get);
router.post('/cities', ...write, validate({ body: v.cityBody }), controller.create);
router.patch('/cities/:id', ...write, validate({ params: v.idParam, body: patchOptional(v.cityBody) }), controller.update);
router.delete('/cities/:id', ...write, validate({ params: v.idParam }), controller.remove);

module.exports = router;
