const systemController = require('../system/system.controller');

module.exports = {
  listRoles: systemController.listRoles,
  createRole: systemController.createRole,
  getRole: systemController.getRole,
  updateRole: systemController.updateRole,
  deleteRole: systemController.deleteRole,
  setRolePermissions: systemController.setRolePermissions,
  listPermissions: systemController.listPermissions,
  createPermission: systemController.createPermission,
  getPermission: systemController.getPermission,
  updatePermission: systemController.updatePermission,
  deletePermission: systemController.deletePermission,
};
