const systemController = require('../system/system.controller');

module.exports = {
  listNotifications: systemController.listNotifications,
  getNotification: systemController.getNotification,
  createNotification: systemController.createNotification,
  markNotificationRead: systemController.markNotificationRead,
  markAllNotificationsRead: systemController.markAllNotificationsRead,
};
