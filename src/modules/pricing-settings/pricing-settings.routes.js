const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./pricing-settings.controller');
const v = require('../master-data/master-data.validation');

const router = Router();
const read = [authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];

router.get('/pricing-settings', ...read, controller.list);
router.get('/pricing-settings/:id', ...read, validate({ params: v.idParam }), controller.get);

module.exports = router;
