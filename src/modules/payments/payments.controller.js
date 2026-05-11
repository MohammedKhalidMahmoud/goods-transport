const systemController = require('../system/system.controller');

module.exports = {
  listPayments: systemController.listPayments,
  createPayment: systemController.createPayment,
  getPayment: systemController.getPayment,
  updatePayment: systemController.updatePayment,
};
