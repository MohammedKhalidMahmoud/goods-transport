const masterDataController = require('../master-data/master-data.controller');

module.exports = {
  list: masterDataController.list('pricingSetting', 'OK'),
  get: masterDataController.get('pricingSetting'),
  create: masterDataController.create('pricingSetting'),
  update: masterDataController.update('pricingSetting'),
  remove: masterDataController.remove('pricingSetting'),
};
