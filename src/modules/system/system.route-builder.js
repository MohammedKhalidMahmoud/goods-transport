const { Router } = require('express');
const Joi = require('joi');
const { authorizePermissions, authorizeRoles, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { upload } = require('../../middlewares/upload');
const { PERMISSIONS } = require('../../constants/permissions');
const { ROLES } = require('../../constants/roles');
const controller = require('./system.controller');

function buildSystemRoutes({ authenticate, dashboardPrefix = '/dashboard' }) {
  const router = Router();
  const tenant = [authenticate, resolveTenantScope];

  router.get('/invoices', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_READ_COMPANY, PERMISSIONS.INVOICES_READ_OWN), controller.listInvoices);
  router.post(
    '/invoices',
    ...tenant,
    authorizePermissions(PERMISSIONS.INVOICES_CREATE),
    validate({
      body: Joi.object({
        orderId: Joi.string().uuid().allow(null),
        companyId: Joi.string().uuid().allow(null),
        providerId: Joi.string().uuid().allow(null),
        subtotal: Joi.number(),
        taxAmount: Joi.number(),
        totalAmount: Joi.number(),
        currency: Joi.string(),
        dueDate: Joi.date().iso().allow(null),
        notes: Joi.string().allow('', null),
        items: Joi.array().items(
          Joi.object({ description: Joi.string().required(), quantity: Joi.number(), unitPrice: Joi.number().required(), amount: Joi.number().required() })
        ),
      }),
    }),
    controller.createInvoice
  );
  router.get('/invoices/:id', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_READ_COMPANY), controller.getInvoice);
  router.patch('/invoices/:id', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_CREATE), controller.updateInvoice);
  router.delete('/invoices/:id', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_CREATE), controller.deleteInvoice);
  router.post('/invoices/:id/issue', ...tenant, authorizePermissions(PERMISSIONS.INVOICES_CREATE), controller.issueInvoice);
  router.post(
    '/invoices/:id/mark-paid',
    ...tenant,
    authorizePermissions(PERMISSIONS.PAYMENTS_CREATE),
    validate({ body: Joi.object({ amount: Joi.number().required(), method: Joi.string().valid('cash', 'bank_transfer', 'online', 'wallet').required() }) }),
    controller.markInvoicePaid
  );

  router.get('/payments', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ), controller.listPayments);
  router.post(
    '/payments',
    ...tenant,
    authorizePermissions(PERMISSIONS.PAYMENTS_CREATE),
    validate({
      body: Joi.object({
        invoiceId: Joi.string().uuid().required(),
        amount: Joi.number().required(),
        method: Joi.string().valid('cash', 'bank_transfer', 'online', 'wallet').required(),
      }),
    }),
    controller.createPayment
  );
  router.get('/payments/:id', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ), controller.getPayment);
  router.patch('/payments/:id', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_CREATE), controller.updatePayment);

  router.get('/commissions', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ, PERMISSIONS.ANALYTICS_READ), controller.listCommissions);
  router.get('/commissions/:id', ...tenant, authorizePermissions(PERMISSIONS.PAYMENTS_READ, PERMISSIONS.ANALYTICS_READ), controller.getCommission);

  router.get('/settlements', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE, PERMISSIONS.SETTLEMENTS_READ_OWN), controller.listSettlements);
  router.get('/settlements/:id', ...tenant, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE, PERMISSIONS.SETTLEMENTS_READ_OWN), controller.getSettlement);
  router.post(
    '/settlements',
    ...tenant,
    authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE),
    validate({
      body: Joi.object({
        providerId: Joi.string().uuid().required(),
        amount: Joi.number().required(),
        periodStart: Joi.date().iso().required(),
        periodEnd: Joi.date().iso().required(),
        currency: Joi.string(),
        reference: Joi.string().allow('', null),
      }),
    }),
    controller.createSettlement
  );

  router.get('/earnings/reports', ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ANALYTICS_READ_PROVIDER), controller.listEarningsReports);
  router.get('/earnings/reports/:id', ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ANALYTICS_READ_PROVIDER), controller.getEarningsReport);

  router.get('/users', ...tenant, authorizePermissions(PERMISSIONS.USERS_READ), controller.listUsers);
  router.post(
    '/users',
    ...tenant,
    authorizePermissions(PERMISSIONS.USERS_CREATE),
    validate({
      body: Joi.object({
        email: Joi.string().email().required(),
        phone: Joi.string().allow('', null),
        password: Joi.string().min(6).required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        jobTitle: Joi.string().allow('', null),
        myAdmin: Joi.boolean(),
        roleId: Joi.string().uuid().required(),
      }),
    }),
    controller.createUser
  );
  router.get('/users/:id', ...tenant, authorizePermissions(PERMISSIONS.USERS_READ), controller.getUser);
  router.patch('/users/:id', ...tenant, authorizePermissions(PERMISSIONS.USERS_UPDATE), controller.updateUser);
  router.delete('/users/:id', ...tenant, authorizePermissions(PERMISSIONS.USERS_DELETE), controller.deleteUser);

  router.get('/roles', authenticate, controller.listRoles);
  router.post(
    '/roles',
    authenticate,
    authorizeRoles(ROLES.SUPER_ADMIN),
    validate({ body: Joi.object({ code: Joi.string().required(), name: Joi.string().required(), description: Joi.string().allow('', null), scopeType: Joi.string() }) }),
    controller.createRole
  );
  router.get('/roles/:id', authenticate, controller.getRole);
  router.patch('/roles/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), controller.updateRole);
  router.delete('/roles/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), controller.deleteRole);
  router.post(
    '/roles/:id/permissions',
    authenticate,
    authorizeRoles(ROLES.SUPER_ADMIN),
    validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ permissionIds: Joi.array().items(Joi.string().uuid()).required() }) }),
    controller.setRolePermissions
  );

  router.get('/permissions', authenticate, controller.listPermissions);
  router.post(
    '/permissions',
    authenticate,
    authorizeRoles(ROLES.SUPER_ADMIN),
    validate({ body: Joi.object({ code: Joi.string().required(), name: Joi.string().required(), module: Joi.string().required(), action: Joi.string().required() }) }),
    controller.createPermission
  );
  router.get('/permissions/:id', authenticate, controller.getPermission);
  router.patch('/permissions/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), controller.updatePermission);
  router.delete('/permissions/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), controller.deletePermission);

  router.get('/profiles/me', authenticate, controller.getMyProfile);
  router.patch(
    '/profiles/me',
    authenticate,
    validate({ body: Joi.object({ firstName: Joi.string(), lastName: Joi.string(), avatarUrl: Joi.string().allow('', null), language: Joi.string() }) }),
    controller.updateMyProfile
  );

  router.get('/customers/me', authenticate, controller.getMyCustomer);
  router.patch('/customers/me', authenticate, validate({ body: Joi.object({ preferredLang: Joi.string() }) }), controller.updateMyCustomer);
  router.get('/customer-addresses', authenticate, controller.listCustomerAddresses);
  router.post(
    '/customer-addresses',
    authenticate,
    validate({
      body: Joi.object({
        label: Joi.string().required(),
        addressLine1: Joi.string().required(),
        city: Joi.string().required(),
        addressLine2: Joi.string().allow('', null),
        area: Joi.string().allow('', null),
        latitude: Joi.number(),
        longitude: Joi.number(),
        floor: Joi.number().integer(),
        unit: Joi.string().allow('', null),
        hasElevator: Joi.boolean(),
        notes: Joi.string().allow('', null),
        isDefault: Joi.boolean(),
      }),
    }),
    controller.createCustomerAddress
  );
  router.get('/customer-addresses/:id', authenticate, controller.getCustomerAddress);
  router.patch('/customer-addresses/:id', authenticate, validate({ body: Joi.object().unknown(true) }), controller.updateCustomerAddress);
  router.delete('/customer-addresses/:id', authenticate, controller.deleteCustomerAddress);
  router.get('/reviews', authenticate, controller.listReviews);
  router.post(
    '/reviews',
    authenticate,
    validate({ body: Joi.object({ orderId: Joi.string().uuid().required(), providerId: Joi.string().uuid().required(), rating: Joi.number().integer().min(1).max(5).required(), comment: Joi.string().allow('', null) }) }),
    controller.createReview
  );

  router.get('/tickets', ...tenant, authorizePermissions(PERMISSIONS.TICKETS_READ, PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_COMPANY), controller.listTickets);
  router.post(
    '/tickets',
    authenticate,
    validate({ body: Joi.object({ subject: Joi.string().required(), description: Joi.string().required(), issueTypeId: Joi.string().uuid().allow(null), orderId: Joi.string().uuid().allow(null), priority: Joi.string() }) }),
    controller.createTicket
  );
  router.get('/tickets/:id', authenticate, resolveTenantScope, controller.getTicket);
  router.patch(
    '/tickets/:id',
    authenticate,
    resolveTenantScope,
    authorizePermissions(PERMISSIONS.TICKETS_UPDATE),
    validate({ body: Joi.object({ subject: Joi.string(), description: Joi.string(), priority: Joi.string(), status: Joi.string() }).min(1) }),
    controller.updateTicket
  );
  router.delete('/tickets/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), controller.deleteTicket);
  router.get('/tickets/:id/comments', authenticate, resolveTenantScope, controller.listTicketComments);
  router.post('/tickets/:id/comments', authenticate, resolveTenantScope, validate({ body: Joi.object({ body: Joi.string().required(), isInternal: Joi.boolean() }) }), controller.createTicketComment);
  router.post('/tickets/:id/assign', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_UPDATE), validate({ body: Joi.object({ assignedTo: Joi.string().uuid().required() }) }), controller.assignTicket);
  router.post('/tickets/:id/resolve', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_RESOLVE), controller.resolveTicket);
  router.post('/tickets/:id/close', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_RESOLVE), controller.closeTicket);
  router.get('/issue-types', authenticate, controller.listIssueTypes);

  router.get('/notifications', authenticate, authorizePermissions(PERMISSIONS.NOTIFICATIONS_READ_OWN), controller.listNotifications);
  router.get('/notifications/:id', authenticate, authorizePermissions(PERMISSIONS.NOTIFICATIONS_READ_OWN), controller.getNotification);
  router.post(
    '/notifications',
    authenticate,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN, ROLES.SUPPORT_ADMIN),
    validate({ body: Joi.object({ userId: Joi.string().uuid().required(), title: Joi.string().required(), body: Joi.string().required(), type: Joi.string() }) }),
    controller.createNotification
  );
  router.post('/notifications/:id/read', authenticate, controller.markNotificationRead);
  router.post('/notifications/read-all', authenticate, controller.markAllNotificationsRead);

  router.post('/uploads', authenticate, upload.single('file'), controller.createUpload);
  router.get('/uploads/:id', authenticate, controller.getUpload);
  router.delete('/uploads/:id', authenticate, controller.deleteUpload);

  router.get(`${dashboardPrefix}/internal/overview`, ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ), controller.getInternalOverview);
  router.get(`${dashboardPrefix}/internal/revenue-summary`, ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ), controller.getRevenueSummary);
  router.get(`${dashboardPrefix}/internal/orders-summary`, ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ), controller.getInternalOrdersSummary);
  router.get(`${dashboardPrefix}/company/overview`, ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ_COMPANY), controller.getCompanyOverview);
  router.get(`${dashboardPrefix}/company/orders-summary`, ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ_COMPANY), controller.getCompanyOrdersSummary);
  router.get(`${dashboardPrefix}/provider/overview`, ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ_PROVIDER), controller.getProviderOverview);
  router.get(`${dashboardPrefix}/provider/performance`, ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ_PROVIDER), controller.getProviderPerformance);
  router.get(`${dashboardPrefix}/provider/earnings-summary`, ...tenant, authorizePermissions(PERMISSIONS.ANALYTICS_READ_PROVIDER), controller.getProviderEarningsSummary);
  router.get('/audit-logs', ...tenant, authorizePermissions(PERMISSIONS.AUDIT_LOGS_READ), controller.listAuditLogs);

  return router;
}

module.exports = { buildSystemRoutes };
