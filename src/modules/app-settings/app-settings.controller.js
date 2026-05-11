const masterDataController = require('../master-data/master-data.controller');

module.exports = {
  list: masterDataController.list('appSetting', 'OK'),
  get: masterDataController.get('appSetting'),
  create: masterDataController.create('appSetting'),
  update: masterDataController.update('appSetting'),
  remove: masterDataController.remove('appSetting'),
};
