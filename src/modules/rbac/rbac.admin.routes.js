const { Router } = require('express');
const Joi = require('joi');
const rbacController = require('./rbac.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { ROLES } = require('../../constants/roles');

const router = Router();

router.get('/roles', authenticateDashboard, rbacController.listRoles);
router.post('/roles', authenticateDashboard, authorizeRoles(ROLES.SUPER_ADMIN), validate({ body: Joi.object({ code: Joi.string().required(), name: Joi.string().required(), description: Joi.string().allow('', null), scopeType: Joi.string() }) }), rbacController.createRole);
router.get('/roles/:id', authenticateDashboard, rbacController.getRole);
router.patch('/roles/:id', authenticateDashboard, authorizeRoles(ROLES.SUPER_ADMIN), rbacController.updateRole);
router.delete('/roles/:id', authenticateDashboard, authorizeRoles(ROLES.SUPER_ADMIN), rbacController.deleteRole);
router.post('/roles/:id/permissions', authenticateDashboard, authorizeRoles(ROLES.SUPER_ADMIN), validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ permissionIds: Joi.array().items(Joi.string().uuid()).required() }) }), rbacController.setRolePermissions);
router.get('/permissions', authenticateDashboard, rbacController.listPermissions);
router.post('/permissions', authenticateDashboard, authorizeRoles(ROLES.SUPER_ADMIN), validate({ body: Joi.object({ code: Joi.string().required(), name: Joi.string().required(), module: Joi.string().required(), action: Joi.string().required() }) }), rbacController.createPermission);
router.get('/permissions/:id', authenticateDashboard, rbacController.getPermission);
router.patch('/permissions/:id', authenticateDashboard, authorizeRoles(ROLES.SUPER_ADMIN), rbacController.updatePermission);
router.delete('/permissions/:id', authenticateDashboard, authorizeRoles(ROLES.SUPER_ADMIN), rbacController.deletePermission);

module.exports = router;
