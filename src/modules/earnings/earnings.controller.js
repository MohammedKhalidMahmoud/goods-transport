const systemController = require('../system/system.controller');

module.exports = {
  listEarningsReports: systemController.listEarningsReports,
  getEarningsReport: systemController.getEarningsReport,
};
