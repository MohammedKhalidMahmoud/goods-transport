const { Router } = require('express');
const Joi = require('joi');
const ticketsController = require('./tickets.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, authorizeRoles, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const { ROLES } = require('../../constants/roles');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

router.get('/tickets', ...tenant, authorizePermissions(PERMISSIONS.TICKETS_READ, PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_COMPANY), ticketsController.listTickets);
router.post('/tickets', authenticate, validate({ body: Joi.object({ subject: Joi.string().required(), description: Joi.string().required(), issueTypeId: Joi.string().uuid().allow(null), orderId: Joi.string().uuid().allow(null), priority: Joi.string() }) }), ticketsController.createTicket);
router.get('/tickets/:id', authenticate, resolveTenantScope, ticketsController.getTicket);
router.patch('/tickets/:id', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_UPDATE), validate({ body: Joi.object({ subject: Joi.string(), description: Joi.string(), priority: Joi.string(), status: Joi.string() }).min(1) }), ticketsController.updateTicket);
router.delete('/tickets/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), ticketsController.deleteTicket);
router.get('/tickets/:id/comments', authenticate, resolveTenantScope, ticketsController.listTicketComments);
router.post('/tickets/:id/comments', authenticate, resolveTenantScope, validate({ body: Joi.object({ body: Joi.string().required(), isInternal: Joi.boolean() }) }), ticketsController.createTicketComment);
router.post('/tickets/:id/assign', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_UPDATE), validate({ body: Joi.object({ assignedTo: Joi.string().uuid().required() }) }), ticketsController.assignTicket);
router.post('/tickets/:id/resolve', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_RESOLVE), ticketsController.resolveTicket);
router.post('/tickets/:id/close', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_RESOLVE), ticketsController.closeTicket);
router.get('/issue-types', authenticate, ticketsController.listIssueTypes);

module.exports = router;
