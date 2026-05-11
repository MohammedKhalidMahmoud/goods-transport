const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { parseListQuery } = require('../../lib/listQuery');
const { AppError } = require('../../utils/AppError');
const { config } = require('../../config');
const { PERMISSIONS } = require('../../constants/permissions');
const { getIo, emitToRoom, EVENTS } = require('../../lib/socketEmitter');
const ticketAccess = require('../support/ticket.access');
const repo = require('./system.repository');

const notFound = (row) => {
  if (!row) throw AppError.notFound();
  return row;
};

async function listInvoices(query, user, tenantScope) {
  const lq = parseListQuery(query, {});
  if (tenantScope.type === 'company') lq.where.companyId = tenantScope.companyId;
  if (tenantScope.type === 'self') lq.where.order = { requesterId: user.id };
  return repo.paginate('invoice', lq, { include: { items: true, order: true } });
}

const createInvoice = (body, user) => repo.createInvoice(body, user.id);
const getInvoice = async (id) => notFound(await repo.findUnique('invoice', { where: { id }, include: { items: true, payments: true } }));
const updateInvoice = (id, body) => repo.update('invoice', { where: { id }, data: body });

async function deleteInvoice(id) {
  const invoice = await getInvoice(id);
  if (invoice.status !== 'draft') throw AppError.unprocessable('Only draft invoices can be deleted');
  await repo.delete('invoice', { where: { id } });
}

const issueInvoice = (id) => repo.update('invoice', { where: { id }, data: { status: 'issued', issuedAt: new Date() } });

async function markInvoicePaid(id, body, user) {
  const invoice = notFound(await repo.findUnique('invoice', { where: { id } }));
  const payment = await repo.create('payment', {
    data: {
      invoiceId: invoice.id,
      amount: body.amount,
      method: body.method,
      status: 'completed',
      paidAt: new Date(),
      createdBy: user.id,
    },
  });
  const paid = Number(invoice.paidAmount) + Number(body.amount);
  const total = Number(invoice.totalAmount);
  const status = paid >= total ? 'paid' : paid > 0 ? 'partially_paid' : invoice.status;
  await repo.update('invoice', { where: { id: invoice.id }, data: { paidAmount: paid, status } });
  return payment;
}

function listPayments(query) {
  return repo.paginate('payment', parseListQuery(query, {}), { include: { invoice: true } });
}

const createPayment = (body, user) =>
  repo.create('payment', { data: { ...body, status: 'completed', paidAt: new Date(), createdBy: user.id } });
const getPayment = async (id) => notFound(await repo.findUnique('payment', { where: { id }, include: { invoice: true } }));
const updatePayment = (id, body) => repo.update('payment', { where: { id }, data: body });

async function listCommissions(query) {
  const lq = parseListQuery(query, {});
  if (query.providerId) lq.where.providerId = query.providerId;
  const result = await repo.paginate('commission', lq, { include: { provider: true } });
  const orderIds = [...new Set(result.rows.map((row) => row.orderId).filter(Boolean))];
  const orders = orderIds.length
    ? await repo.findMany('order', { where: { id: { in: orderIds } }, select: { id: true, orderNumber: true, status: true } })
    : [];
  const orderMap = new Map(orders.map((order) => [order.id, order]));
  return { ...result, rows: result.rows.map((row) => ({ ...row, order: row.orderId ? orderMap.get(row.orderId) || null : null })) };
}

async function getCommission(id) {
  const commission = notFound(await repo.findUnique('commission', { where: { id }, include: { provider: true } }));
  const order = commission.orderId ? await repo.findUnique('order', { where: { id: commission.orderId } }) : null;
  return { ...commission, order };
}

function listSettlements(query, tenantScope) {
  const lq = parseListQuery(query, {});
  if (tenantScope.type === 'provider') lq.where.providerId = tenantScope.providerId;
  return repo.paginate('settlement', lq, { include: { provider: true } });
}

async function getSettlement(id, tenantScope) {
  const settlement = notFound(await repo.findUnique('settlement', { where: { id }, include: { provider: true } }));
  if (tenantScope.type === 'provider' && settlement.providerId !== tenantScope.providerId) throw AppError.forbidden();
  return settlement;
}

const createSettlement = (body, user) => repo.create('settlement', { data: { ...body, createdBy: user.id } });

function listEarningsReports(query, tenantScope) {
  const lq = parseListQuery(query, {});
  if (tenantScope.type === 'provider') {
    lq.where.subjectType = 'provider';
    lq.where.subjectId = tenantScope.providerId;
  }
  return repo.paginate('earningsReport', lq);
}

async function getEarningsReport(id, tenantScope) {
  const row = notFound(await repo.findUnique('earningsReport', { where: { id } }));
  if (tenantScope.type === 'provider' && (row.subjectType !== 'provider' || row.subjectId !== tenantScope.providerId)) {
    throw AppError.forbidden();
  }
  return row;
}

function listUsers(query) {
  const lq = parseListQuery(query, { searchFields: ['email'] });
  lq.where.deletedAt = null;
  return repo.paginate('user', lq, { include: { dashboardProfile: { include: { role: true } }, userRoles: { include: { role: true } } } });
}

async function createUser(body) {
  const hash = await bcrypt.hash(body.password, 12);
  return repo.createDashboardUser(body, hash);
}

const getUser = async (id) =>
  notFound(await repo.findUnique('user', { where: { id }, include: { dashboardProfile: { include: { role: true } }, userRoles: { include: { role: true } } } }));
const updateUser = (id, body) => repo.update('user', { where: { id }, data: body });
const deleteUser = (id) => repo.update('user', { where: { id }, data: { deletedAt: new Date() } });

const listRoles = () => repo.findMany('role', { orderBy: { code: 'asc' } });
const createRole = (body) => repo.create('role', { data: body });
const getRole = async (id) => notFound(await repo.findUnique('role', { where: { id }, include: { rolePermissions: { include: { permission: true } } } }));

async function updateRole(id, body) {
  const role = await getRole(id);
  if (role.isSystem) throw AppError.unprocessable('Cannot modify system role');
  return repo.update('role', { where: { id }, data: body });
}

async function deleteRole(id) {
  const role = await getRole(id);
  if (role.isSystem) throw AppError.unprocessable('Cannot delete system role');
  await repo.delete('role', { where: { id } });
}

const listPermissions = () => repo.findMany('permission', { orderBy: { code: 'asc' } });
const createPermission = (body) => repo.create('permission', { data: body });
const getPermission = async (id) => notFound(await repo.findUnique('permission', { where: { id } }));
const updatePermission = (id, body) => repo.update('permission', { where: { id }, data: body });
const deletePermission = (id) => repo.delete('permission', { where: { id } });
const setRolePermissions = (id, permissionIds) => repo.setRolePermissions(id, permissionIds);

const getMyProfile = (user) => repo.findUnique('user', { where: { id: user.id }, select: { id: true, firstName: true, lastName: true, avatarUrl: true, language: true } });
const updateMyProfile = (user, body) => repo.update('user', { where: { id: user.id }, data: body });

async function getMyCustomer(user) {
  return notFound(await repo.findUnique('individualCustomer', { where: { userId: user.id }, include: { user: true } }));
}

const updateMyCustomer = (user, body) => repo.update('individualCustomer', { where: { userId: user.id }, data: body });

async function getCustomerProfile(user) {
  return notFound(await repo.findUnique('individualCustomer', { where: { userId: user.id } }));
}

async function listCustomerAddresses(user) {
  const customer = await getCustomerProfile(user);
  return repo.findMany('customerAddress', { where: { individualCustomerId: customer.id } });
}

async function createCustomerAddress(user, body) {
  const customer = await getCustomerProfile(user);
  return repo.create('customerAddress', { data: { ...body, individualCustomerId: customer.id } });
}

async function getCustomerAddress(user, id) {
  const customer = await getCustomerProfile(user);
  return notFound(await repo.findFirst('customerAddress', { where: { id, individualCustomerId: customer.id } }));
}

async function updateCustomerAddress(user, id, body) {
  await getCustomerAddress(user, id);
  return repo.update('customerAddress', { where: { id }, data: body });
}

async function deleteCustomerAddress(user, id) {
  const customer = await getCustomerProfile(user);
  await repo.deleteMany('customerAddress', { where: { id, individualCustomerId: customer.id } });
}

async function listReviews(user) {
  const customer = await repo.findUnique('individualCustomer', { where: { userId: user.id } });
  if (!customer) return [];
  return repo.findMany('customerReview', { where: { individualCustomerId: customer.id }, include: { provider: true, order: true } });
}

async function createReview(user, body) {
  const customer = await getCustomerProfile(user);
  const order = await repo.findFirst('order', { where: { id: body.orderId, status: 'completed', requesterId: user.id } });
  if (!order) throw AppError.unprocessable('Order not completed');
  return repo.create('customerReview', { data: { ...body, individualCustomerId: customer.id } });
}

async function listTickets(req) {
  const lq = parseListQuery(req.query, { searchFields: ['subject'] });
  const baseWhere = { ...lq.where };
  let where = baseWhere;
  const tenantScope = req.tenantScope;
  if (
    tenantScope.type === 'self' ||
    (tenantScope.type === 'assignment' && !(req.user.roles || []).some((role) => ['super_admin', 'support_admin'].includes(role)))
  ) {
    where = { ...baseWhere, userId: req.user.id };
  } else if (
    tenantScope.type === 'company' &&
    (req.user.permissions || []).includes(PERMISSIONS.TICKETS_READ_COMPANY) &&
    !(req.user.permissions || []).includes(PERMISSIONS.TICKETS_READ)
  ) {
    const companyId = tenantScope.companyId;
    const staffIds = (await repo.findMany('companyUser', { where: { companyId }, select: { userId: true } })).map((row) => row.userId);
    const orderIds = (await repo.findMany('order', { where: { companyId }, select: { id: true } })).map((row) => row.id);
    where = { AND: [baseWhere, { OR: [{ userId: { in: staffIds } }, { orderId: { in: orderIds } }] }] };
  }
  lq.where = where;
  return repo.paginate('ticket', lq);
}

async function createTicket(req) {
  const ticket = await repo.create('ticket', {
    data: {
      ticketNumber: `TKT-${Date.now()}`,
      userId: req.user.id,
      subject: req.body.subject,
      description: req.body.description,
      issueTypeId: req.body.issueTypeId,
      orderId: req.body.orderId,
      priority: req.body.priority || 'medium',
    },
  });
  emitToRoom(getIo(req.app), 'internal:support', EVENTS.TICKET_UPDATED, { ticketId: ticket.id });
  return ticket;
}

async function getTicket(req) {
  await ticketAccess.assertCanViewTicket(req, req.params.id);
  return repo.findUnique('ticket', { where: { id: req.params.id }, include: { comments: true } });
}

async function updateTicket(req) {
  await ticketAccess.assertCanViewTicket(req, req.params.id);
  return repo.update('ticket', { where: { id: req.params.id }, data: req.body });
}

const deleteTicket = (id) => repo.delete('ticket', { where: { id } });

async function listTicketComments(req) {
  await ticketAccess.assertCanViewTicket(req, req.params.id);
  return repo.findMany('ticketComment', { where: { ticketId: req.params.id }, orderBy: { createdAt: 'asc' } });
}

async function createTicketComment(req) {
  await ticketAccess.assertCanViewTicket(req, req.params.id);
  if (req.body.isInternal && !(req.user.permissions || []).includes(PERMISSIONS.TICKETS_UPDATE)) throw AppError.forbidden();
  return repo.create('ticketComment', {
    data: { ticketId: req.params.id, userId: req.user.id, body: req.body.body, isInternal: !!req.body.isInternal },
  });
}

async function assignTicket(req) {
  await ticketAccess.assertCanViewTicket(req, req.params.id);
  return repo.update('ticket', { where: { id: req.params.id }, data: { assignedTo: req.body.assignedTo, status: 'in_progress' } });
}

async function transitionTicket(req, status) {
  await ticketAccess.assertCanViewTicket(req, req.params.id);
  const data = status === 'resolved' ? { status, resolvedAt: new Date() } : { status, closedAt: new Date() };
  return repo.update('ticket', { where: { id: req.params.id }, data });
}

const listIssueTypes = () => repo.findMany('issueType', { where: { isActive: true } });

function listNotifications(query, user) {
  const lq = parseListQuery(query, {});
  lq.where.userId = user.id;
  return repo.paginate('notification', lq);
}

const getNotification = async (user, id) => notFound(await repo.findFirst('notification', { where: { id, userId: user.id } }));
const createNotification = (body) => repo.create('notification', { data: body });
const markNotificationRead = (user, id) => repo.updateMany('notification', { where: { id, userId: user.id }, data: { isRead: true, readAt: new Date() } });
const markAllNotificationsRead = (user) => repo.updateMany('notification', { where: { userId: user.id, isRead: false }, data: { isRead: true, readAt: new Date() } });

async function createUpload(req) {
  if (!req.file) throw AppError.badRequest('file required');
  const allowed = ['order_attachment', 'provider_document', 'delivery_proof', 'invoice_document', 'support_attachment', 'profile_image', 'company_logo'];
  const category = allowed.includes(req.body.category) ? req.body.category : 'order_attachment';
  return repo.create('fileAsset', {
    data: {
      category,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: `/uploads/${req.file.filename}`,
      entityType: req.body.entityType || null,
      entityId: req.body.entityId || null,
      uploadedBy: req.user.id,
    },
  });
}

async function getUpload(user, id) {
  const asset = notFound(await repo.findFirst('fileAsset', { where: { id, deletedAt: null } }));
  if (asset.uploadedBy !== user.id && !(user.permissions || []).includes(PERMISSIONS.USERS_READ)) throw AppError.forbidden();
  return asset;
}

async function deleteUpload(user, id) {
  const asset = notFound(await repo.findFirst('fileAsset', { where: { id } }));
  if (asset.uploadedBy !== user.id && !(user.permissions || []).includes(PERMISSIONS.USERS_DELETE)) throw AppError.forbidden();
  const abs = path.join(process.cwd(), config.upload.dir, path.basename(asset.filePath));
  await repo.update('fileAsset', { where: { id: asset.id }, data: { deletedAt: new Date() } });
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

async function getInternalOverview() {
  const [orders, users, providers, companies] = await Promise.all([
    repo.count('order', { where: { deletedAt: null } }),
    repo.count('user', { where: { deletedAt: null } }),
    repo.count('provider', { where: { deletedAt: null } }),
    repo.count('company', { where: { deletedAt: null } }),
  ]);
  return { orders, users, providers, companies };
}

async function getRevenueSummary() {
  const agg = await repo.aggregate('invoice', { _sum: { totalAmount: true, paidAmount: true } });
  return { totalInvoiced: agg._sum.totalAmount || 0, totalPaid: agg._sum.paidAmount || 0 };
}

const getInternalOrdersSummary = () => repo.groupBy('order', { by: ['status'], _count: { id: true }, where: { deletedAt: null } });
const getCompanyOverview = async (tenantScope) => ({ orders: await repo.count('order', { where: { companyId: tenantScope.companyId, deletedAt: null } }) });
const getCompanyOrdersSummary = (tenantScope) => repo.groupBy('order', { by: ['status'], where: { companyId: tenantScope.companyId, deletedAt: null }, _count: { id: true } });

async function getProviderOverview(tenantScope) {
  const [offers, assignments] = await Promise.all([
    repo.count('offer', { where: { providerId: tenantScope.providerId } }),
    repo.count('assignment', { where: { providerId: tenantScope.providerId } }),
  ]);
  return { offers, assignments };
}

async function getProviderPerformance(tenantScope) {
  const completed = await repo.count('assignment', { where: { providerId: tenantScope.providerId, status: 'completed' } });
  return { completedAssignments: completed };
}

async function getProviderEarningsSummary(tenantScope) {
  const agg = await repo.aggregate('commission', { where: { providerId: tenantScope.providerId }, _sum: { amount: true } });
  const wallet = await repo.findUnique('providerWallet', { where: { providerId: tenantScope.providerId } });
  return { commissions: agg._sum.amount || 0, wallet };
}

const listAuditLogs = (query) => repo.paginate('auditLog', parseListQuery(query, {}));

module.exports = {
  listInvoices,
  createInvoice,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  issueInvoice,
  markInvoicePaid,
  listPayments,
  createPayment,
  getPayment,
  updatePayment,
  listCommissions,
  getCommission,
  listSettlements,
  getSettlement,
  createSettlement,
  listEarningsReports,
  getEarningsReport,
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  listRoles,
  createRole,
  getRole,
  updateRole,
  deleteRole,
  listPermissions,
  createPermission,
  getPermission,
  updatePermission,
  deletePermission,
  setRolePermissions,
  getMyProfile,
  updateMyProfile,
  getMyCustomer,
  updateMyCustomer,
  listCustomerAddresses,
  createCustomerAddress,
  getCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  listReviews,
  createReview,
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
  listTicketComments,
  createTicketComment,
  assignTicket,
  transitionTicket,
  listIssueTypes,
  listNotifications,
  getNotification,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  createUpload,
  getUpload,
  deleteUpload,
  getInternalOverview,
  getRevenueSummary,
  getInternalOrdersSummary,
  getCompanyOverview,
  getCompanyOrdersSummary,
  getProviderOverview,
  getProviderPerformance,
  getProviderEarningsSummary,
  listAuditLogs,
};
