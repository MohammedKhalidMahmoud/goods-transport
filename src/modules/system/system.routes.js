const { Router } = require('express');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { prisma } = require('../../lib/prisma');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, authorizeRoles, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { upload } = require('../../middlewares/upload');
const { success, paginated } = require('../../utils/response');
const { PERMISSIONS } = require('../../constants/permissions');
const { ROLES } = require('../../constants/roles');
const { AppError } = require('../../utils/AppError');
const { parseListQuery } = require('../../lib/listQuery');
const { config } = require('../../config');
const { getIo, emitToRoom, EVENTS } = require('../../lib/socketEmitter');
const ticketAccess = require('../support/ticket.access');

const router = Router();
const t = [authenticate, resolveTenantScope];

// --- Finance: invoices ---
router.get('/invoices', ...t, authorizePermissions(PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_READ_COMPANY, PERMISSIONS.INVOICES_READ_OWN), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const w = { ...lq.where };
    if (req.tenantScope.type === 'company') w.companyId = req.tenantScope.companyId;
    if (req.tenantScope.type === 'self') {
      w.order = { requesterId: req.user.id };
    }
    const [total, rows] = await Promise.all([
      prisma.invoice.count({ where: w }),
      prisma.invoice.findMany({
        where: w,
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
        include: { items: true, order: true },
      }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/invoices',
  ...t,
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
  async (req, res, next) => {
    try {
      const num = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const inv = await prisma.$transaction(async (tx) => {
        const i = await tx.invoice.create({
          data: {
            invoiceNumber: num,
            orderId: req.body.orderId || null,
            companyId: req.body.companyId || null,
            providerId: req.body.providerId || null,
            subtotal: req.body.subtotal ?? 0,
            taxAmount: req.body.taxAmount ?? 0,
            totalAmount: req.body.totalAmount ?? 0,
            currency: req.body.currency || 'SAR',
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
            notes: req.body.notes,
            createdBy: req.user.id,
          },
        });
        if (req.body.items?.length) {
          for (const it of req.body.items) {
            await tx.invoiceItem.create({ data: { ...it, invoiceId: i.id } });
          }
        }
        return i;
      });
      return success(res, await prisma.invoice.findUnique({ where: { id: inv.id }, include: { items: true } }), 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/invoices/:id', ...t, authorizePermissions(PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_READ_COMPANY), async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { items: true, payments: true } });
    if (!inv) throw AppError.notFound();
    return success(res, inv);
  } catch (e) {
    next(e);
  }
});

router.patch('/invoices/:id', ...t, authorizePermissions(PERMISSIONS.INVOICES_CREATE), async (req, res, next) => {
  try {
    const u = await prisma.invoice.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/invoices/:id', ...t, authorizePermissions(PERMISSIONS.INVOICES_CREATE), async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (inv.status !== 'draft') throw AppError.unprocessable('Only draft invoices can be deleted');
    await prisma.invoice.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.post('/invoices/:id/issue', ...t, authorizePermissions(PERMISSIONS.INVOICES_CREATE), async (req, res, next) => {
  try {
    const u = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'issued', issuedAt: new Date() },
    });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/invoices/:id/mark-paid',
  ...t,
  authorizePermissions(PERMISSIONS.PAYMENTS_CREATE),
  validate({ body: Joi.object({ amount: Joi.number().required(), method: Joi.string().valid('cash', 'bank_transfer', 'online', 'wallet').required() }) }),
  async (req, res, next) => {
    try {
      const inv = await prisma.invoice.findUnique({ where: { id: req.params.id } });
      const pay = await prisma.payment.create({
        data: {
          invoiceId: inv.id,
          amount: req.body.amount,
          method: req.body.method,
          status: 'completed',
          paidAt: new Date(),
          createdBy: req.user.id,
        },
      });
      const paid = Number(inv.paidAmount) + Number(req.body.amount);
      const total = Number(inv.totalAmount);
      let status = inv.status;
      if (paid >= total) status = 'paid';
      else if (paid > 0) status = 'partially_paid';
      await prisma.invoice.update({ where: { id: inv.id }, data: { paidAmount: paid, status } });
      return success(res, pay, 'Recorded', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/payments', ...t, authorizePermissions(PERMISSIONS.PAYMENTS_READ), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const [total, rows] = await Promise.all([
      prisma.payment.count({ where: lq.where }),
      prisma.payment.findMany({
        where: lq.where,
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
        include: { invoice: true },
      }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/payments',
  ...t,
  authorizePermissions(PERMISSIONS.PAYMENTS_CREATE),
  validate({
    body: Joi.object({
      invoiceId: Joi.string().uuid().required(),
      amount: Joi.number().required(),
      method: Joi.string().valid('cash', 'bank_transfer', 'online', 'wallet').required(),
    }),
  }),
  async (req, res, next) => {
    try {
      const pay = await prisma.payment.create({
        data: { ...req.body, status: 'completed', paidAt: new Date(), createdBy: req.user.id },
      });
      return success(res, pay, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/payments/:id', ...t, authorizePermissions(PERMISSIONS.PAYMENTS_READ), async (req, res, next) => {
  try {
    const p = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { invoice: true } });
    if (!p) throw AppError.notFound();
    return success(res, p);
  } catch (e) {
    next(e);
  }
});

router.patch('/payments/:id', ...t, authorizePermissions(PERMISSIONS.PAYMENTS_CREATE), async (req, res, next) => {
  try {
    const u = await prisma.payment.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.get('/commissions', ...t, authorizePermissions(PERMISSIONS.PAYMENTS_READ, PERMISSIONS.ANALYTICS_READ), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const w = { ...lq.where };
    if (req.query.providerId) w.providerId = req.query.providerId;
    const [total, rawRows] = await Promise.all([
      prisma.commission.count({ where: w }),
      prisma.commission.findMany({
        where: w,
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
        include: { provider: true },
      }),
    ]);
    const orderIds = [...new Set(rawRows.map((r) => r.orderId).filter(Boolean))];
    let orderMap = new Map();
    if (orderIds.length) {
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, orderNumber: true, status: true },
      });
      orderMap = new Map(orders.map((o) => [o.id, o]));
    }
    const rows = rawRows.map((r) => ({ ...r, order: r.orderId ? orderMap.get(r.orderId) || null : null }));
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.get('/commissions/:id', ...t, authorizePermissions(PERMISSIONS.PAYMENTS_READ, PERMISSIONS.ANALYTICS_READ), async (req, res, next) => {
  try {
    const c = await prisma.commission.findUnique({ where: { id: req.params.id }, include: { provider: true } });
    if (!c) throw AppError.notFound();
    const order = c.orderId ? await prisma.order.findUnique({ where: { id: c.orderId } }) : null;
    return success(res, { ...c, order });
  } catch (e) {
    next(e);
  }
});

router.get('/settlements', ...t, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE, PERMISSIONS.SETTLEMENTS_READ_OWN), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const w = { ...lq.where };
    if (req.tenantScope.type === 'provider') w.providerId = req.tenantScope.providerId;
    const [total, rows] = await Promise.all([
      prisma.settlement.count({ where: w }),
      prisma.settlement.findMany({
        where: w,
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
        include: { provider: true },
      }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.get('/settlements/:id', ...t, authorizePermissions(PERMISSIONS.SETTLEMENTS_MANAGE, PERMISSIONS.SETTLEMENTS_READ_OWN), async (req, res, next) => {
  try {
    const s = await prisma.settlement.findUnique({ where: { id: req.params.id }, include: { provider: true } });
    if (!s) throw AppError.notFound();
    if (req.tenantScope.type === 'provider' && s.providerId !== req.tenantScope.providerId) {
      throw AppError.forbidden();
    }
    return success(res, s);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/settlements',
  ...t,
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
  async (req, res, next) => {
    try {
      const s = await prisma.settlement.create({ data: { ...req.body, createdBy: req.user.id } });
      return success(res, s, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/earnings/reports', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ANALYTICS_READ_PROVIDER), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const w = { ...lq.where };
    if (req.tenantScope.type === 'provider') {
      w.subjectType = 'provider';
      w.subjectId = req.tenantScope.providerId;
    }
    const [total, rows] = await Promise.all([
      prisma.earningsReport.count({ where: w }),
      prisma.earningsReport.findMany({ where: w, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.get('/earnings/reports/:id', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ANALYTICS_READ_PROVIDER), async (req, res, next) => {
  try {
    const row = await prisma.earningsReport.findUnique({ where: { id: req.params.id } });
    if (!row) throw AppError.notFound();
    if (
      req.tenantScope.type === 'provider' &&
      (row.subjectType !== 'provider' || row.subjectId !== req.tenantScope.providerId)
    ) {
      throw AppError.forbidden();
    }
    return success(res, row);
  } catch (e) {
    next(e);
  }
});

// --- Users ---
router.get('/users', ...t, authorizePermissions(PERMISSIONS.USERS_READ), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, { searchFields: ['email'] });
    const w = { ...lq.where, deletedAt: null };
    const [total, rows] = await Promise.all([
      prisma.user.count({ where: w }),
      prisma.user.findMany({
        where: w,
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
        include: { profile: true, userRoles: { include: { role: true } } },
      }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/users',
  ...t,
  authorizePermissions(PERMISSIONS.USERS_CREATE),
  validate({
    body: Joi.object({
      email: Joi.string().email().required(),
      phone: Joi.string().allow('', null),
      password: Joi.string().min(6).required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      roleIds: Joi.array().items(Joi.string().uuid()),
    }),
  }),
  async (req, res, next) => {
    try {
      const hash = await bcrypt.hash(req.body.password, 12);
      const u = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: req.body.email,
            phone: req.body.phone || null,
            passwordHash: hash,
            status: 'active',
          },
        });
        await tx.profile.create({
          data: { userId: user.id, firstName: req.body.firstName, lastName: req.body.lastName },
        });
        if (req.body.roleIds?.length) {
          for (const rid of req.body.roleIds) {
            await tx.userRole.create({ data: { userId: user.id, roleId: rid } });
          }
        }
        return user;
      });
      return success(res, u, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/users/:id', ...t, authorizePermissions(PERMISSIONS.USERS_READ), async (req, res, next) => {
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { profile: true, userRoles: { include: { role: true } } },
    });
    if (!u) throw AppError.notFound();
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.patch('/users/:id', ...t, authorizePermissions(PERMISSIONS.USERS_UPDATE), async (req, res, next) => {
  try {
    const u = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:id', ...t, authorizePermissions(PERMISSIONS.USERS_DELETE), async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/roles', authenticate, async (_req, res, next) => {
  try {
    const rows = await prisma.role.findMany({ orderBy: { code: 'asc' } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/roles',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  validate({ body: Joi.object({ code: Joi.string().required(), name: Joi.string().required(), description: Joi.string().allow('', null), scopeType: Joi.string() }) }),
  async (req, res, next) => {
    try {
      const r = await prisma.role.create({ data: req.body });
      return success(res, r, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/roles/:id', authenticate, async (req, res, next) => {
  try {
    const r = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!r) throw AppError.notFound();
    return success(res, r);
  } catch (e) {
    next(e);
  }
});

router.patch('/roles/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const r = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (r.isSystem) throw AppError.unprocessable('Cannot modify system role');
    const u = await prisma.role.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/roles/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const r = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (r.isSystem) throw AppError.unprocessable('Cannot delete system role');
    await prisma.role.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/permissions', authenticate, async (_req, res, next) => {
  try {
    const rows = await prisma.permission.findMany({ orderBy: { code: 'asc' } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/permissions',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  validate({
    body: Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required(),
      module: Joi.string().required(),
      action: Joi.string().required(),
    }),
  }),
  async (req, res, next) => {
    try {
      const p = await prisma.permission.create({ data: req.body });
      return success(res, p, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/permissions/:id', authenticate, async (req, res, next) => {
  try {
    const p = await prisma.permission.findUnique({ where: { id: req.params.id } });
    if (!p) throw AppError.notFound();
    return success(res, p);
  } catch (e) {
    next(e);
  }
});

router.patch('/permissions/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const u = await prisma.permission.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/permissions/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    await prisma.permission.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/roles/:id/permissions',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN),
  validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: Joi.object({ permissionIds: Joi.array().items(Joi.string().uuid()).required() }) }),
  async (req, res, next) => {
    try {
      await prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
      for (const pid of req.body.permissionIds) {
        await prisma.rolePermission.create({ data: { roleId: req.params.id, permissionId: pid } });
      }
      return success(res, null, 'Updated');
    } catch (e) {
      next(e);
    }
  }
);

router.get('/profiles/me', authenticate, async (req, res, next) => {
  try {
    const p = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    return success(res, p);
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/profiles/me',
  authenticate,
  validate({
    body: Joi.object({
      firstName: Joi.string(),
      lastName: Joi.string(),
      avatarUrl: Joi.string().allow('', null),
      bio: Joi.string().allow('', null),
      language: Joi.string(),
      timezone: Joi.string(),
    }),
  }),
  async (req, res, next) => {
    try {
      const p = await prisma.profile.update({ where: { userId: req.user.id }, data: req.body });
      return success(res, p);
    } catch (e) {
      next(e);
    }
  }
);

// --- Customers ---
router.get('/customers/me', authenticate, async (req, res, next) => {
  try {
    const c = await prisma.individualCustomer.findUnique({
      where: { userId: req.user.id },
      include: { user: { include: { profile: true } } },
    });
    if (!c) throw AppError.notFound('Customer profile not found');
    return success(res, c);
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/customers/me',
  authenticate,
  validate({ body: Joi.object({ preferredLang: Joi.string() }) }),
  async (req, res, next) => {
    try {
      const c = await prisma.individualCustomer.update({ where: { userId: req.user.id }, data: req.body });
      return success(res, c);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/customer-addresses', authenticate, async (req, res, next) => {
  try {
    const ic = await prisma.individualCustomer.findUnique({ where: { userId: req.user.id } });
    if (!ic) throw AppError.notFound();
    const rows = await prisma.customerAddress.findMany({ where: { individualCustomerId: ic.id } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

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
  async (req, res, next) => {
    try {
      const ic = await prisma.individualCustomer.findUnique({ where: { userId: req.user.id } });
      const a = await prisma.customerAddress.create({
        data: { ...req.body, individualCustomerId: ic.id },
      });
      return success(res, a, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch('/customer-addresses/:id', authenticate, validate({ body: Joi.object().unknown(true) }), async (req, res, next) => {
  try {
    const ic = await prisma.individualCustomer.findUnique({ where: { userId: req.user.id } });
    const a = await prisma.customerAddress.findFirst({ where: { id: req.params.id, individualCustomerId: ic.id } });
    if (!a) throw AppError.notFound();
    const u = await prisma.customerAddress.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/customer-addresses/:id', authenticate, async (req, res, next) => {
  try {
    const ic = await prisma.individualCustomer.findUnique({ where: { userId: req.user.id } });
    await prisma.customerAddress.deleteMany({ where: { id: req.params.id, individualCustomerId: ic.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/customer-addresses/:id', authenticate, async (req, res, next) => {
  try {
    const ic = await prisma.individualCustomer.findUnique({ where: { userId: req.user.id } });
    const a = await prisma.customerAddress.findFirst({ where: { id: req.params.id, individualCustomerId: ic.id } });
    if (!a) throw AppError.notFound();
    return success(res, a);
  } catch (e) {
    next(e);
  }
});

router.get('/reviews', authenticate, async (req, res, next) => {
  try {
    const ic = await prisma.individualCustomer.findUnique({ where: { userId: req.user.id } });
    if (!ic) return success(res, []);
    const rows = await prisma.customerReview.findMany({ where: { individualCustomerId: ic.id }, include: { provider: true, order: true } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/reviews',
  authenticate,
  validate({
    body: Joi.object({
      orderId: Joi.string().uuid().required(),
      providerId: Joi.string().uuid().required(),
      rating: Joi.number().integer().min(1).max(5).required(),
      comment: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      const ic = await prisma.individualCustomer.findUnique({ where: { userId: req.user.id } });
      const order = await prisma.order.findFirst({ where: { id: req.body.orderId, status: 'completed', requesterId: req.user.id } });
      if (!order) throw AppError.unprocessable('Order not completed');
      const r = await prisma.customerReview.create({ data: { ...req.body, individualCustomerId: ic.id } });
      return success(res, r, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

// --- Support ---
router.get('/tickets', ...t, authorizePermissions(PERMISSIONS.TICKETS_READ, PERMISSIONS.TICKETS_READ_OWN, PERMISSIONS.TICKETS_READ_COMPANY), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, { searchFields: ['subject'] });
    const baseWhere = { ...lq.where };
    let where = baseWhere;

    if (
      req.tenantScope.type === 'self' ||
      (req.tenantScope.type === 'assignment' && !req.user.roles.some((r) => ['super_admin', 'support_admin'].includes(r)))
    ) {
      where = { ...baseWhere, userId: req.user.id };
    } else if (
      req.tenantScope.type === 'company' &&
      req.user.permissions.includes(PERMISSIONS.TICKETS_READ_COMPANY) &&
      !req.user.permissions.includes(PERMISSIONS.TICKETS_READ)
    ) {
      const companyId = req.tenantScope.companyId;
      const staffIds = (
        await prisma.companyUser.findMany({ where: { companyId }, select: { userId: true } })
      ).map((x) => x.userId);
      const orderIds = (
        await prisma.order.findMany({ where: { companyId }, select: { id: true } })
      ).map((x) => x.id);
      where = {
        AND: [baseWhere, { OR: [{ userId: { in: staffIds } }, { orderId: { in: orderIds } }] }],
      };
    }

    const [total, rows] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({ where, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/tickets',
  authenticate,
  validate({
    body: Joi.object({
      subject: Joi.string().required(),
      description: Joi.string().required(),
      issueTypeId: Joi.string().uuid().allow(null),
      orderId: Joi.string().uuid().allow(null),
      priority: Joi.string(),
    }),
  }),
  async (req, res, next) => {
    try {
      const num = `TKT-${Date.now()}`;
      const tkt = await prisma.ticket.create({
        data: {
          ticketNumber: num,
          userId: req.user.id,
          subject: req.body.subject,
          description: req.body.description,
          issueTypeId: req.body.issueTypeId,
          orderId: req.body.orderId,
          priority: req.body.priority || 'medium',
        },
      });
      const io = getIo(req.app);
      emitToRoom(io, 'internal:support', EVENTS.TICKET_UPDATED, { ticketId: tkt.id });
      return success(res, tkt, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/tickets/:id', authenticate, resolveTenantScope, async (req, res, next) => {
  try {
    await ticketAccess.assertCanViewTicket(req, req.params.id);
    const tkt = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: { comments: true } });
    return success(res, tkt);
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/tickets/:id',
  authenticate,
  resolveTenantScope,
  authorizePermissions(PERMISSIONS.TICKETS_UPDATE),
  validate({ body: Joi.object({ subject: Joi.string(), description: Joi.string(), priority: Joi.string(), status: Joi.string() }).min(1) }),
  async (req, res, next) => {
    try {
      await ticketAccess.assertCanViewTicket(req, req.params.id);
      const u = await prisma.ticket.update({ where: { id: req.params.id }, data: req.body });
      return success(res, u);
    } catch (e) {
      next(e);
    }
  }
);

router.delete('/tickets/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    await prisma.ticket.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/tickets/:id/comments', authenticate, resolveTenantScope, async (req, res, next) => {
  try {
    await ticketAccess.assertCanViewTicket(req, req.params.id);
    const rows = await prisma.ticketComment.findMany({ where: { ticketId: req.params.id }, orderBy: { createdAt: 'asc' } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/tickets/:id/comments',
  authenticate,
  resolveTenantScope,
  validate({ body: Joi.object({ body: Joi.string().required(), isInternal: Joi.boolean() }) }),
  async (req, res, next) => {
    try {
      await ticketAccess.assertCanViewTicket(req, req.params.id);
      if (req.body.isInternal && !req.user.permissions.includes(PERMISSIONS.TICKETS_UPDATE)) {
        throw AppError.forbidden();
      }
      const c = await prisma.ticketComment.create({
        data: { ticketId: req.params.id, userId: req.user.id, body: req.body.body, isInternal: !!req.body.isInternal },
      });
      return success(res, c, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/tickets/:id/assign',
  authenticate,
  resolveTenantScope,
  authorizePermissions(PERMISSIONS.TICKETS_UPDATE),
  validate({ body: Joi.object({ assignedTo: Joi.string().uuid().required() }) }),
  async (req, res, next) => {
    try {
      await ticketAccess.assertCanViewTicket(req, req.params.id);
      const u = await prisma.ticket.update({
        where: { id: req.params.id },
        data: { assignedTo: req.body.assignedTo, status: 'in_progress' },
      });
      return success(res, u);
    } catch (e) {
      next(e);
    }
  }
);

router.post('/tickets/:id/resolve', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_RESOLVE), async (req, res, next) => {
  try {
    await ticketAccess.assertCanViewTicket(req, req.params.id);
    const u = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: 'resolved', resolvedAt: new Date() },
    });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.post('/tickets/:id/close', authenticate, resolveTenantScope, authorizePermissions(PERMISSIONS.TICKETS_RESOLVE), async (req, res, next) => {
  try {
    await ticketAccess.assertCanViewTicket(req, req.params.id);
    const u = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: 'closed', closedAt: new Date() },
    });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.get('/issue-types', authenticate, async (_req, res, next) => {
  try {
    const rows = await prisma.issueType.findMany({ where: { isActive: true } });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

// --- Notifications ---
router.get('/notifications', authenticate, authorizePermissions(PERMISSIONS.NOTIFICATIONS_READ_OWN), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const w = { ...lq.where, userId: req.user.id };
    const [total, rows] = await Promise.all([
      prisma.notification.count({ where: w }),
      prisma.notification.findMany({ where: w, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.get('/notifications/:id', authenticate, authorizePermissions(PERMISSIONS.NOTIFICATIONS_READ_OWN), async (req, res, next) => {
  try {
    const n = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!n) throw AppError.notFound();
    return success(res, n);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/notifications',
  authenticate,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN, ROLES.SUPPORT_ADMIN),
  validate({ body: Joi.object({ userId: Joi.string().uuid().required(), title: Joi.string().required(), body: Joi.string().required(), type: Joi.string() }) }),
  async (req, res, next) => {
    try {
      const n = await prisma.notification.create({ data: req.body });
      return success(res, n, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.post('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const n = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true, readAt: new Date() },
    });
    return success(res, { updated: n.count });
  } catch (e) {
    next(e);
  }
});

router.post('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return success(res, null, 'OK');
  } catch (e) {
    next(e);
  }
});

// --- Uploads ---
router.post('/uploads', authenticate, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) throw AppError.badRequest('file required');
      const allowed = [
        'order_attachment',
        'provider_document',
        'delivery_proof',
        'invoice_document',
        'support_attachment',
        'profile_image',
        'company_logo',
      ];
      const category = allowed.includes(req.body.category) ? req.body.category : 'order_attachment';
      const rel = `/uploads/${req.file.filename}`;
      const asset = await prisma.fileAsset.create({
        data: {
          category,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          filePath: rel,
          entityType: req.body.entityType || null,
          entityId: req.body.entityId || null,
          uploadedBy: req.user.id,
        },
      });
      return success(res, asset, 'Uploaded', 201);
    } catch (e) {
      next(e);
    }
});

router.get('/uploads/:id', authenticate, async (req, res, next) => {
  try {
    const a = await prisma.fileAsset.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!a) throw AppError.notFound();
    if (a.uploadedBy !== req.user.id && !req.user.permissions.includes(PERMISSIONS.USERS_READ)) throw AppError.forbidden();
    return success(res, a);
  } catch (e) {
    next(e);
  }
});

router.delete('/uploads/:id', authenticate, async (req, res, next) => {
  try {
    const a = await prisma.fileAsset.findFirst({ where: { id: req.params.id } });
    if (!a) throw AppError.notFound();
    if (a.uploadedBy !== req.user.id && !req.user.permissions.includes(PERMISSIONS.USERS_DELETE)) throw AppError.forbidden();
    const abs = path.join(process.cwd(), config.upload.dir, path.basename(a.filePath));
    await prisma.fileAsset.update({ where: { id: a.id }, data: { deletedAt: new Date() } });
    try {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {
      /* ignore */
    }
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

// --- Dashboard ---
router.get('/dashboard/internal/overview', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ), async (_req, res, next) => {
  try {
    const [orders, users, providers, companies] = await Promise.all([
      prisma.order.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.provider.count({ where: { deletedAt: null } }),
      prisma.company.count({ where: { deletedAt: null } }),
    ]);
    return success(res, { orders, users, providers, companies });
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/internal/revenue-summary', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ), async (_req, res, next) => {
  try {
    const agg = await prisma.invoice.aggregate({ _sum: { totalAmount: true, paidAmount: true } });
    return success(res, { totalInvoiced: agg._sum.totalAmount || 0, totalPaid: agg._sum.paidAmount || 0 });
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/internal/orders-summary', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ), async (_req, res, next) => {
  try {
    const grouped = await prisma.order.groupBy({ by: ['status'], _count: { id: true }, where: { deletedAt: null } });
    return success(res, grouped);
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/company/overview', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ_COMPANY), async (req, res, next) => {
  try {
    const cid = req.tenantScope.companyId;
    const orders = await prisma.order.count({ where: { companyId: cid, deletedAt: null } });
    return success(res, { orders });
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/company/orders-summary', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ_COMPANY), async (req, res, next) => {
  try {
    const cid = req.tenantScope.companyId;
    const grouped = await prisma.order.groupBy({
      by: ['status'],
      where: { companyId: cid, deletedAt: null },
      _count: { id: true },
    });
    return success(res, grouped);
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/provider/overview', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ_PROVIDER), async (req, res, next) => {
  try {
    const pid = req.tenantScope.providerId;
    const [offers, assignments] = await Promise.all([
      prisma.offer.count({ where: { providerId: pid } }),
      prisma.assignment.count({ where: { providerId: pid } }),
    ]);
    return success(res, { offers, assignments });
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/provider/performance', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ_PROVIDER), async (req, res, next) => {
  try {
    const pid = req.tenantScope.providerId;
    const completed = await prisma.assignment.count({ where: { providerId: pid, status: 'completed' } });
    return success(res, { completedAssignments: completed });
  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/provider/earnings-summary', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ_PROVIDER), async (req, res, next) => {
  try {
    const pid = req.tenantScope.providerId;
    const agg = await prisma.commission.aggregate({ where: { providerId: pid }, _sum: { amount: true } });
    const w = await prisma.providerWallet.findUnique({ where: { providerId: pid } });
    return success(res, { commissions: agg._sum.amount || 0, wallet: w });
  } catch (e) {
    next(e);
  }
});

router.get('/audit-logs', ...t, authorizePermissions(PERMISSIONS.AUDIT_LOGS_READ), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where: lq.where }),
      prisma.auditLog.findMany({ where: lq.where, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

module.exports = router;
