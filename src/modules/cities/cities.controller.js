const masterDataController = require('../master-data/master-data.controller');

module.exports = {
  list: masterDataController.list('city', 'OK'),
  get: masterDataController.get('city'),
  create: masterDataController.create('city'),
  update: masterDataController.update('city'),
  remove: masterDataController.remove('city'),
};
