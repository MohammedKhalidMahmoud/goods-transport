const { Router } = require('express');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./vehicle-types.controller');
const v = require('../master-data/master-data.validation');

const router = Router();
const read = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];
const write = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE)];
const patchOptional = (schema) => schema.fork(Object.keys(schema.describe().keys || {}), (key) => key.optional());

router.get('/vehicle-types', ...read, controller.list);
router.get('/vehicle-types/:id', ...read, validate({ params: v.idParam }), controller.get);
router.post('/vehicle-types', ...write, validate({ body: v.vehicleTypeBody }), controller.create);
router.patch('/vehicle-types/:id', ...write, validate({ params: v.idParam, body: patchOptional(v.vehicleTypeBody) }), controller.update);
router.delete('/vehicle-types/:id', ...write, validate({ params: v.idParam }), controller.remove);

module.exports = router;
