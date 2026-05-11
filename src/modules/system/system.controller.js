const { success, paginated } = require('../../utils/response');
const service = require('./system.service');

const ok = (fn, message, status) => async (req, res, next) => {
  try {
    const data = await fn(req);
    return success(res, data, message, status);
  } catch (error) {
    return next(error);
  }
};

const empty = (fn, message = 'Deleted') => async (req, res, next) => {
  try {
    await fn(req);
    return success(res, null, message);
  } catch (error) {
    return next(error);
  }
};

const page = (fn, message = 'OK') => async (req, res, next) => {
  try {
    const { rows, total, page: currentPage, limit } = await fn(req);
    return paginated(res, rows, { page: currentPage, limit, total }, message);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listInvoices: page((req) => service.listInvoices(req.query, req.user, req.tenantScope)),
  createInvoice: ok((req) => service.createInvoice(req.body, req.user), 'Created', 201),
  getInvoice: ok((req) => service.getInvoice(req.params.id)),
  updateInvoice: ok((req) => service.updateInvoice(req.params.id, req.body)),
  deleteInvoice: empty((req) => service.deleteInvoice(req.params.id)),
  issueInvoice: ok((req) => service.issueInvoice(req.params.id)),
  markInvoicePaid: ok((req) => service.markInvoicePaid(req.params.id, req.body, req.user), 'Recorded', 201),
  listPayments: page((req) => service.listPayments(req.query)),
  createPayment: ok((req) => service.createPayment(req.body, req.user), 'Created', 201),
  getPayment: ok((req) => service.getPayment(req.params.id)),
  updatePayment: ok((req) => service.updatePayment(req.params.id, req.body)),
  listCommissions: page((req) => service.listCommissions(req.query)),
  getCommission: ok((req) => service.getCommission(req.params.id)),
  listSettlements: page((req) => service.listSettlements(req.query, req.tenantScope)),
  getSettlement: ok((req) => service.getSettlement(req.params.id, req.tenantScope)),
  createSettlement: ok((req) => service.createSettlement(req.body, req.user), 'Created', 201),
  listEarningsReports: page((req) => service.listEarningsReports(req.query, req.tenantScope)),
  getEarningsReport: ok((req) => service.getEarningsReport(req.params.id, req.tenantScope)),
  listUsers: page((req) => service.listUsers(req.query)),
  createUser: ok((req) => service.createUser(req.body), 'Created', 201),
  getUser: ok((req) => service.getUser(req.params.id)),
  updateUser: ok((req) => service.updateUser(req.params.id, req.body)),
  deleteUser: empty((req) => service.deleteUser(req.params.id)),
  listRoles: ok(() => service.listRoles()),
  createRole: ok((req) => service.createRole(req.body), 'Created', 201),
  getRole: ok((req) => service.getRole(req.params.id)),
  updateRole: ok((req) => service.updateRole(req.params.id, req.body)),
  deleteRole: empty((req) => service.deleteRole(req.params.id)),
  listPermissions: ok(() => service.listPermissions()),
  createPermission: ok((req) => service.createPermission(req.body), 'Created', 201),
  getPermission: ok((req) => service.getPermission(req.params.id)),
  updatePermission: ok((req) => service.updatePermission(req.params.id, req.body)),
  deletePermission: empty((req) => service.deletePermission(req.params.id)),
  setRolePermissions: empty((req) => service.setRolePermissions(req.params.id, req.body.permissionIds), 'Updated'),
  getMyProfile: ok((req) => service.getMyProfile(req.user)),
  updateMyProfile: ok((req) => service.updateMyProfile(req.user, req.body)),
  getMyCustomer: ok((req) => service.getMyCustomer(req.user)),
  updateMyCustomer: ok((req) => service.updateMyCustomer(req.user, req.body)),
  listCustomerAddresses: ok((req) => service.listCustomerAddresses(req.user)),
  createCustomerAddress: ok((req) => service.createCustomerAddress(req.user, req.body), 'Created', 201),
  getCustomerAddress: ok((req) => service.getCustomerAddress(req.user, req.params.id)),
  updateCustomerAddress: ok((req) => service.updateCustomerAddress(req.user, req.params.id, req.body)),
  deleteCustomerAddress: empty((req) => service.deleteCustomerAddress(req.user, req.params.id)),
  listReviews: ok((req) => service.listReviews(req.user)),
  createReview: ok((req) => service.createReview(req.user, req.body), 'Created', 201),
  listTickets: page((req) => service.listTickets(req)),
  createTicket: ok((req) => service.createTicket(req), 'Created', 201),
  getTicket: ok((req) => service.getTicket(req)),
  updateTicket: ok((req) => service.updateTicket(req)),
  deleteTicket: empty((req) => service.deleteTicket(req.params.id)),
  listTicketComments: ok((req) => service.listTicketComments(req)),
  createTicketComment: ok((req) => service.createTicketComment(req), 'Created', 201),
  assignTicket: ok((req) => service.assignTicket(req)),
  resolveTicket: ok((req) => service.transitionTicket(req, 'resolved')),
  closeTicket: ok((req) => service.transitionTicket(req, 'closed')),
  listIssueTypes: ok(() => service.listIssueTypes()),
  listNotifications: page((req) => service.listNotifications(req.query, req.user)),
  getNotification: ok((req) => service.getNotification(req.user, req.params.id)),
  createNotification: ok((req) => service.createNotification(req.body), 'Created', 201),
  markNotificationRead: ok(async (req) => ({ updated: (await service.markNotificationRead(req.user, req.params.id)).count })),
  markAllNotificationsRead: empty((req) => service.markAllNotificationsRead(req.user), 'OK'),
  createUpload: ok((req) => service.createUpload(req), 'Uploaded', 201),
  getUpload: ok((req) => service.getUpload(req.user, req.params.id)),
  deleteUpload: empty((req) => service.deleteUpload(req.user, req.params.id)),
  getInternalOverview: ok(() => service.getInternalOverview()),
  getRevenueSummary: ok(() => service.getRevenueSummary()),
  getInternalOrdersSummary: ok(() => service.getInternalOrdersSummary()),
  getCompanyOverview: ok((req) => service.getCompanyOverview(req.tenantScope)),
  getCompanyOrdersSummary: ok((req) => service.getCompanyOrdersSummary(req.tenantScope)),
  getProviderOverview: ok((req) => service.getProviderOverview(req.tenantScope)),
  getProviderPerformance: ok((req) => service.getProviderPerformance(req.tenantScope)),
  getProviderEarningsSummary: ok((req) => service.getProviderEarningsSummary(req.tenantScope)),
  listAuditLogs: page((req) => service.listAuditLogs(req.query)),
};
