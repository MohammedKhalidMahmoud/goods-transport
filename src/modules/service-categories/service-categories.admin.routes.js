const { Router } = require('express');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./service-categories.controller');
const v = require('../master-data/master-data.validation');

const router = Router();
const read = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];
const write = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE)];
const patchOptional = (schema) => schema.fork(Object.keys(schema.describe().keys || {}), (key) => key.optional());

router.get('/service-categories', ...read, controller.list);
router.get('/service-categories/:id', ...read, validate({ params: v.idParam }), controller.get);
router.post('/service-categories', ...write, validate({ body: v.categoryBody }), controller.create);
router.patch('/service-categories/:id', ...write, validate({ params: v.idParam, body: patchOptional(v.categoryBody) }), controller.update);
router.delete('/service-categories/:id', ...write, validate({ params: v.idParam }), controller.remove);

module.exports = router;
