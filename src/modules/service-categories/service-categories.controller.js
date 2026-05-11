const masterDataController = require('../master-data/master-data.controller');

module.exports = {
  list: masterDataController.list('category', 'OK'),
  get: masterDataController.get('category'),
  create: masterDataController.create('category'),
  update: masterDataController.update('category'),
  remove: masterDataController.remove('category'),
};
