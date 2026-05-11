const systemController = require('../system/system.controller');

module.exports = {
  listSettlements: systemController.listSettlements,
  getSettlement: systemController.getSettlement,
  createSettlement: systemController.createSettlement,
};
