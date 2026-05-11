const { Router } = require('express');
const notificationsController = require('./notifications.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions } = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.get('/notifications', authenticate, authorizePermissions(PERMISSIONS.NOTIFICATIONS_READ_OWN), notificationsController.listNotifications);
router.get('/notifications/:id', authenticate, authorizePermissions(PERMISSIONS.NOTIFICATIONS_READ_OWN), notificationsController.getNotification);
router.post('/notifications/:id/read', authenticate, notificationsController.markNotificationRead);
router.post('/notifications/read-all', authenticate, notificationsController.markAllNotificationsRead);

module.exports = router;
