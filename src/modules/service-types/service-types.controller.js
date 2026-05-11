const masterDataController = require('../master-data/master-data.controller');

module.exports = {
  list: masterDataController.list('serviceType', 'OK'),
  get: masterDataController.get('serviceType'),
  create: masterDataController.create('serviceType'),
  update: masterDataController.update('serviceType'),
  remove: masterDataController.remove('serviceType'),
};
