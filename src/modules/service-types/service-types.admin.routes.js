const { Router } = require('express');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./service-types.controller');
const v = require('../master-data/master-data.validation');

const router = Router();
const read = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];
const write = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE)];
const patchOptional = (schema) => schema.fork(Object.keys(schema.describe().keys || {}), (key) => key.optional());

router.get('/service-types', ...read, controller.list);
router.get('/service-types/:id', ...read, validate({ params: v.idParam }), controller.get);
router.post('/service-types', ...write, validate({ body: v.serviceTypeBody }), controller.create);
router.patch('/service-types/:id', ...write, validate({ params: v.idParam, body: patchOptional(v.serviceTypeBody) }), controller.update);
router.delete('/service-types/:id', ...write, validate({ params: v.idParam }), controller.remove);

module.exports = router;
