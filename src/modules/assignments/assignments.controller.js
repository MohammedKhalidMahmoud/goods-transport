const operationsController = require('../operations/operations.controller');

module.exports = {
  listAssignments: operationsController.listAssignments,
  createAssignment: operationsController.createAssignment,
  getAssignment: operationsController.getAssignment,
  updateAssignment: operationsController.updateAssignment,
  cancelAssignment: operationsController.cancelAssignment,
};
