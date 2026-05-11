const { Router } = require('express');
const Joi = require('joi');
const usersController = require('./users.controller');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticateDashboard, resolveTenantScope];

router.get('/users', ...tenant, authorizePermissions(PERMISSIONS.USERS_READ), usersController.listUsers);
router.post('/users', ...tenant, authorizePermissions(PERMISSIONS.USERS_CREATE), validate({ body: Joi.object({ email: Joi.string().email().required(), phone: Joi.string().allow('', null), password: Joi.string().min(6).required(), firstName: Joi.string().required(), lastName: Joi.string().required(), jobTitle: Joi.string().allow('', null), myAdmin: Joi.boolean(), roleId: Joi.string().uuid().required() }) }), usersController.createUser);
router.get('/users/:id', ...tenant, authorizePermissions(PERMISSIONS.USERS_READ), usersController.getUser);
router.patch('/users/:id', ...tenant, authorizePermissions(PERMISSIONS.USERS_UPDATE), usersController.updateUser);
router.delete('/users/:id', ...tenant, authorizePermissions(PERMISSIONS.USERS_DELETE), usersController.deleteUser);

module.exports = router;
