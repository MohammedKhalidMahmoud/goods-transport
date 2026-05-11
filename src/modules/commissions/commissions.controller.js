const systemController = require('../system/system.controller');

module.exports = {
  listCommissions: systemController.listCommissions,
  getCommission: systemController.getCommission,
};
