const { Router } = require('express');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./services.controller');
const v = require('../master-data/master-data.validation');

const router = Router();
const read = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];
const write = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE)];
const patchOptional = (schema) => schema.fork(Object.keys(schema.describe().keys || {}), (key) => key.optional());

router.get('/services', ...read, controller.list);
router.get('/services/:id', ...read, validate({ params: v.idParam }), controller.get);
router.post('/services', ...write, validate({ body: v.serviceBody }), controller.create);
router.patch('/services/:id', ...write, validate({ params: v.idParam, body: patchOptional(v.serviceBody) }), controller.update);
router.delete('/services/:id', ...write, validate({ params: v.idParam }), controller.remove);

module.exports = router;
