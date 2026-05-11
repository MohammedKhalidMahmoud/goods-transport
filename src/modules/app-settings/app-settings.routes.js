const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./app-settings.controller');

const router = Router();
const read = [authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];

router.get('/app-settings/app', ...read, controller.getAppSettingsTab);
router.get('/app-settings/help-support', ...read, controller.getHelpSupportTab);
router.get('/app-settings/privacy-policy', ...read, controller.getPrivacyPolicyTab);

module.exports = router;
