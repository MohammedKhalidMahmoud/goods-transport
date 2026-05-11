const masterDataController = require('../master-data/master-data.controller');

module.exports = {
  list: masterDataController.list('service', 'OK'),
  get: masterDataController.get('service'),
  create: masterDataController.create('service'),
  update: masterDataController.update('service'),
  remove: masterDataController.remove('service'),
};
