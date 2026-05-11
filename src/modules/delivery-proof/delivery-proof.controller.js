const operationsController = require('../operations/operations.controller');

module.exports = {
  listDeliveryProofs: operationsController.listDeliveryProofs,
  createDeliveryProof: operationsController.createDeliveryProof,
  updateDeliveryProof: operationsController.updateDeliveryProof,
};
