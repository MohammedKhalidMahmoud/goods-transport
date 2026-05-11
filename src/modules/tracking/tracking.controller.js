const operationsController = require('../operations/operations.controller');

module.exports = {
  listTracking: operationsController.listTracking,
  listTrackingHistory: operationsController.listTrackingHistory,
  createTrackingEvent: operationsController.createTrackingEvent,
  createLocationEvent: operationsController.createLocationEvent,
};
