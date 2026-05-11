const operationsController = require('../operations/operations.controller');

module.exports = {
  listOffers: operationsController.listOffers,
  createOffer: operationsController.createOffer,
  getOffer: operationsController.getOffer,
  updateOffer: operationsController.updateOffer,
  withdrawOffer: operationsController.withdrawOffer,
  acceptOffer: operationsController.acceptOffer,
  rejectOffer: operationsController.rejectOffer,
};
