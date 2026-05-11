const systemController = require('../system/system.controller');

module.exports = {
  listUsers: systemController.listUsers,
  createUser: systemController.createUser,
  getUser: systemController.getUser,
  updateUser: systemController.updateUser,
  deleteUser: systemController.deleteUser,
};
