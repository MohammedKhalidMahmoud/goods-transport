const { prisma } = require('../../lib/prisma');

const delegates = {
  invoice: prisma.invoice,
  invoiceItem: prisma.invoiceItem,
  payment: prisma.payment,
  commission: prisma.commission,
  settlement: prisma.settlement,
  earningsReport: prisma.earningsReport,
  user: prisma.user,
  role: prisma.role,
  permission: prisma.permission,
  rolePermission: prisma.rolePermission,
  dashboardUserProfile: prisma.dashboardUserProfile,
  userRole: prisma.userRole,
  ticket: prisma.ticket,
  ticketComment: prisma.ticketComment,
  issueType: prisma.issueType,
  notification: prisma.notification,
  order: prisma.order,
  companyUser: prisma.companyUser,
  provider: prisma.provider,
  company: prisma.company,
  offer: prisma.offer,
  assignment: prisma.assignment,
  providerWallet: prisma.providerWallet,
};

const delegate = (model) => delegates[model];

class SystemRepository {
  paginate(model, lq, options = {}) {
    const d = delegate(model);
    return Promise.all([
      d.count({ where: lq.where }),
      d.findMany({ where: lq.where, orderBy: lq.orderBy, skip: lq.skip, take: lq.take, ...options }),
    ]).then(([total, rows]) => ({ rows, total, page: lq.page, limit: lq.limit }));
  }

  count(model, args = {}) {
    return delegate(model).count(args);
  }

  findMany(model, args = {}) {
    return delegate(model).findMany(args);
  }

  findUnique(model, args) {
    return delegate(model).findUnique(args);
  }

  findFirst(model, args) {
    return delegate(model).findFirst(args);
  }

  create(model, args) {
    return delegate(model).create(args);
  }

  update(model, args) {
    return delegate(model).update(args);
  }

  updateMany(model, args) {
    return delegate(model).updateMany(args);
  }

  delete(model, args) {
    return delegate(model).delete(args);
  }

  deleteMany(model, args) {
    return delegate(model).deleteMany(args);
  }

  aggregate(model, args) {
    return delegate(model).aggregate(args);
  }

  groupBy(model, args) {
    return delegate(model).groupBy(args);
  }

  transaction(handler) {
    return prisma.$transaction(handler);
  }

  async createInvoice(body, userId) {
    const invoice = await prisma.$transaction(async (tx) => {
      const row = await tx.invoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          orderId: body.orderId || null,
          companyId: body.companyId || null,
          providerId: body.providerId || null,
          subtotal: body.subtotal ?? 0,
          taxAmount: body.taxAmount ?? 0,
          totalAmount: body.totalAmount ?? 0,
          currency: body.currency || 'SAR',
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          notes: body.notes,
          createdBy: userId,
        },
      });

      for (const item of body.items || []) {
        await tx.invoiceItem.create({ data: { ...item, invoiceId: row.id } });
      }

      return row;
    });

    return prisma.invoice.findUnique({ where: { id: invoice.id }, include: { items: true } });
  }

  async createDashboardUser(body, passwordHash) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          phone: body.phone || null,
          passwordHash,
          firstName: body.firstName,
          lastName: body.lastName,
          userType: 'DASHBOARD',
          status: 'ACTIVE',
        },
      });

      await tx.userRole.create({ data: { userId: user.id, roleId: body.roleId } });
      await tx.dashboardUserProfile.create({
        data: {
          userId: user.id,
          roleId: body.roleId,
          jobTitle: body.jobTitle || null,
          myAdmin: Boolean(body.myAdmin),
        },
      });

      return user;
    });
  }

  async setRolePermissions(roleId, permissionIds) {
    return prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      for (const permissionId of permissionIds) {
        await tx.rolePermission.create({ data: { roleId, permissionId } });
      }
    });
  }
}

module.exports = new SystemRepository();
