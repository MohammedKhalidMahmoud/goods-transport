const { Router } = require('express');
const Joi = require('joi');
const ticketsController = require('./tickets.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();
const tenant = [authenticate, resolveTenantScope];

router.get('/tickets', ...tenant, authorizePermissions(PERMISSIONS.TICKETS_READ, PERMISSIONS.TICKETS_READ_OWN), ticketsController.listTickets);
router.post('/tickets', authenticate, validate({ body: Joi.object({ subject: Joi.string().required(), description: Joi.string().required(), issueTypeId: Joi.string().uuid().allow(null), orderId: Joi.string().uuid().allow(null), priority: Joi.string() }) }), ticketsController.createTicket);
router.get('/tickets/:id', authenticate, resolveTenantScope, ticketsController.getTicket);
router.get('/tickets/:id/comments', authenticate, resolveTenantScope, ticketsController.listTicketComments);
router.post('/tickets/:id/comments', authenticate, resolveTenantScope, validate({ body: Joi.object({ body: Joi.string().required(), isInternal: Joi.boolean() }) }), ticketsController.createTicketComment);
router.get('/issue-types', authenticate, ticketsController.listIssueTypes);

module.exports = router;
