const masterDataController = require('../master-data/master-data.controller');

module.exports = {
  list: masterDataController.list('vehicleType', 'OK'),
  get: masterDataController.get('vehicleType'),
  create: masterDataController.create('vehicleType'),
  update: masterDataController.update('vehicleType'),
  remove: masterDataController.remove('vehicleType'),
};
