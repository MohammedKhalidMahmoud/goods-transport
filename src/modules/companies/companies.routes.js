const { Router } = require('express');
const Joi = require('joi');
const { prisma } = require('../../lib/prisma');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { success, paginated } = require('../../utils/response');
const { PERMISSIONS } = require('../../constants/permissions');
const { AppError } = require('../../utils/AppError');
const { parseListQuery } = require('../../lib/listQuery');
const { mergeWhere, companyTenantWhere } = require('../../utils/tenantQuery');

const router = Router();
const t = [authenticate, resolveTenantScope];

router.get('/companies', ...t, authorizePermissions(PERMISSIONS.COMPANIES_READ, PERMISSIONS.COMPANIES_READ_OWN), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, { searchFields: ['name', 'contactEmail'] });
    let w = { ...lq.where, deletedAt: null };
    if (req.tenantScope.type === 'company') {
      const f = companyTenantWhere(req.tenantScope);
      w = mergeWhere(w, f || {});
    }
    const [total, rows] = await Promise.all([
      prisma.company.count({ where: w }),
      prisma.company.findMany({ where: w, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/companies',
  ...t,
  authorizePermissions(PERMISSIONS.COMPANIES_CREATE),
  validate({
    body: Joi.object({
      name: Joi.string().required(),
      nameAr: Joi.string().allow('', null),
      contactEmail: Joi.string().email().required(),
      contactPhone: Joi.string().required(),
      address: Joi.string().allow('', null),
      taxNumber: Joi.string().allow('', null),
      industry: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      const c = await prisma.company.create({
        data: { ...req.body, createdBy: req.user.id },
      });
      return success(res, c, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/companies/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_READ, PERMISSIONS.COMPANIES_READ_OWN), async (req, res, next) => {
  try {
    const c = await prisma.company.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!c) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && c.id !== req.tenantScope.companyId) throw AppError.forbidden();
    return success(res, c);
  } catch (e) {
    next(e);
  }
});

router.patch('/companies/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_UPDATE, PERMISSIONS.COMPANIES_UPDATE_OWN), async (req, res, next) => {
  try {
    if (req.tenantScope.type === 'company' && req.params.id !== req.tenantScope.companyId) throw AppError.forbidden();
    const c = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
    return success(res, c);
  } catch (e) {
    next(e);
  }
});

router.delete('/companies/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_DELETE), async (req, res, next) => {
  try {
    if (req.tenantScope.type === 'company' && req.params.id !== req.tenantScope.companyId) throw AppError.forbidden();
    await prisma.company.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

// Branches
router.get('/company-branches', ...t, authorizePermissions(PERMISSIONS.COMPANIES_READ_OWN, PERMISSIONS.COMPANIES_READ), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, { searchFields: ['name'] });
    const w = { ...lq.where };
    if (req.tenantScope.type === 'company') w.companyId = req.tenantScope.companyId;
    else if (req.query.companyId) w.companyId = req.query.companyId;
    const [total, rows] = await Promise.all([
      prisma.companyBranch.count({ where: w }),
      prisma.companyBranch.findMany({
        where: w,
        include: { company: { select: { id: true, name: true, nameAr: true } } },
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
      }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/company-branches',
  ...t,
  authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_BRANCHES),
  validate({
    body: Joi.object({
      companyId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      nameAr: Joi.string().allow('', null),
      address: Joi.string().allow('', null),
      phone: Joi.string().allow('', null),
      city: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      if (req.tenantScope.type === 'company' && req.body.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
      const b = await prisma.companyBranch.create({ data: req.body });
      return success(res, b, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/company-branches/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_READ_OWN), async (req, res, next) => {
  try {
    const b = await prisma.companyBranch.findUnique({ where: { id: req.params.id } });
    if (!b) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && b.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    return success(res, b);
  } catch (e) {
    next(e);
  }
});

router.patch('/company-branches/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_BRANCHES), async (req, res, next) => {
  try {
    const b = await prisma.companyBranch.findUnique({ where: { id: req.params.id } });
    if (req.tenantScope.type === 'company' && b.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    const u = await prisma.companyBranch.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/company-branches/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_BRANCHES), async (req, res, next) => {
  try {
    const b = await prisma.companyBranch.findUnique({ where: { id: req.params.id } });
    if (!b) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && b.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    await prisma.companyBranch.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

// Company users
router.get('/company-users', ...t, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS, PERMISSIONS.USERS_READ), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, {});
    const w = { ...lq.where };
    if (req.tenantScope.type === 'company') w.companyId = req.tenantScope.companyId;
    else if (req.query.companyId) w.companyId = req.query.companyId;
    const [total, rows] = await Promise.all([
      prisma.companyUser.count({ where: w }),
      prisma.companyUser.findMany({
        where: w,
        include: { user: { include: { profile: true } }, company: { select: { id: true, name: true, nameAr: true } } },
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
      }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/company-users',
  ...t,
  authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS),
  validate({
    body: Joi.object({
      companyId: Joi.string().uuid().required(),
      userId: Joi.string().uuid().required(),
      branchId: Joi.string().uuid().allow(null),
      role: Joi.string().required(),
    }),
  }),
  async (req, res, next) => {
    try {
      if (req.tenantScope.type === 'company' && req.body.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
      const cu = await prisma.companyUser.create({ data: req.body });
      return success(res, cu, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch('/company-users/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS), async (req, res, next) => {
  try {
    const cu = await prisma.companyUser.findUnique({ where: { id: req.params.id } });
    if (!cu) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && cu.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    const u = await prisma.companyUser.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/company-users/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS), async (req, res, next) => {
  try {
    const cu = await prisma.companyUser.findUnique({ where: { id: req.params.id } });
    if (!cu) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && cu.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    await prisma.companyUser.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/company-users/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_MANAGE_USERS), async (req, res, next) => {
  try {
    const cu = await prisma.companyUser.findUnique({
      where: { id: req.params.id },
      include: { user: { include: { profile: true } } },
    });
    if (!cu) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && cu.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    return success(res, cu);
  } catch (e) {
    next(e);
  }
});

// Billing profiles
router.get('/company-billing-profiles', ...t, authorizePermissions(PERMISSIONS.COMPANIES_READ_OWN, PERMISSIONS.INVOICES_READ_COMPANY), async (req, res, next) => {
  try {
    const w = {};
    if (req.tenantScope.type === 'company') w.companyId = req.tenantScope.companyId;
    else if (req.query.companyId) w.companyId = req.query.companyId;
    const rows = await prisma.companyBillingProfile.findMany({ where: w });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.get('/company-billing-profiles/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_READ_OWN, PERMISSIONS.INVOICES_READ_COMPANY), async (req, res, next) => {
  try {
    const p = await prisma.companyBillingProfile.findUnique({ where: { id: req.params.id } });
    if (!p) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && p.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    return success(res, p);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/company-billing-profiles',
  ...t,
  authorizePermissions(PERMISSIONS.COMPANIES_UPDATE_OWN, PERMISSIONS.COMPANIES_UPDATE),
  validate({
    body: Joi.object({
      companyId: Joi.string().uuid().required(),
      billingName: Joi.string().required(),
      billingEmail: Joi.string().email().required(),
      billingAddress: Joi.string().allow('', null),
      taxNumber: Joi.string().allow('', null),
      paymentTermsDays: Joi.number().integer(),
      creditLimit: Joi.number(),
      currency: Joi.string(),
      isDefault: Joi.boolean(),
    }),
  }),
  async (req, res, next) => {
    try {
      if (req.tenantScope.type === 'company' && req.body.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
      const p = await prisma.companyBillingProfile.create({ data: req.body });
      return success(res, p, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch('/company-billing-profiles/:id', ...t, authorizePermissions(PERMISSIONS.COMPANIES_UPDATE_OWN), async (req, res, next) => {
  try {
    const p = await prisma.companyBillingProfile.findUnique({ where: { id: req.params.id } });
    if (!p) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && p.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    const u = await prisma.companyBillingProfile.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

// Approval rules
router.get('/approval-rules', ...t, authorizePermissions(PERMISSIONS.APPROVALS_READ), async (req, res, next) => {
  try {
    const w = {};
    if (req.tenantScope.type === 'company') w.companyId = req.tenantScope.companyId;
    else if (req.query.companyId) w.companyId = req.query.companyId;
    const rows = await prisma.approvalRule.findMany({ where: w });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/approval-rules',
  ...t,
  authorizePermissions(PERMISSIONS.APPROVALS_APPROVE, PERMISSIONS.SETTINGS_MANAGE_COMPANY),
  validate({
    body: Joi.object({
      companyId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      serviceTypeCode: Joi.string().allow('', null),
      minAmount: Joi.number().allow(null),
      maxAmount: Joi.number().allow(null),
      approverRole: Joi.string().required(),
      level: Joi.number().integer(),
    }),
  }),
  async (req, res, next) => {
    try {
      if (req.tenantScope.type === 'company' && req.body.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
      const r = await prisma.approvalRule.create({ data: req.body });
      return success(res, r, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch('/approval-rules/:id', ...t, authorizePermissions(PERMISSIONS.SETTINGS_MANAGE_COMPANY), async (req, res, next) => {
  try {
    const r = await prisma.approvalRule.findUnique({ where: { id: req.params.id } });
    if (!r) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && r.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    const u = await prisma.approvalRule.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/approval-rules/:id', ...t, authorizePermissions(PERMISSIONS.SETTINGS_MANAGE_COMPANY), async (req, res, next) => {
  try {
    const r = await prisma.approvalRule.findUnique({ where: { id: req.params.id } });
    if (!r) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && r.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    await prisma.approvalRule.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

// Approvals queue (:id = orderId)
router.get('/approvals', ...t, authorizePermissions(PERMISSIONS.APPROVALS_READ), async (req, res, next) => {
  try {
    const w = { status: 'pending_approval', deletedAt: null };
    if (req.tenantScope.type === 'company') w.companyId = req.tenantScope.companyId;
    const rows = await prisma.order.findMany({
      where: w,
      include: { requester: { include: { profile: true } }, serviceType: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, rows);
  } catch (e) {
    next(e);
  }
});

router.get('/approvals/:id', ...t, authorizePermissions(PERMISSIONS.APPROVALS_READ), async (req, res, next) => {
  try {
    const o = await prisma.order.findFirst({
      where: { id: req.params.id, status: 'pending_approval', deletedAt: null },
      include: {
        requester: { include: { profile: true } },
        serviceType: true,
        vehicleType: true,
        approvalHistory: true,
        locations: true,
        items: true,
        attachments: true,
      },
    });
    if (!o) throw AppError.notFound();
    if (req.tenantScope.type === 'company' && o.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
    return success(res, o);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/approvals/:id/approve',
  ...t,
  authorizePermissions(PERMISSIONS.APPROVALS_APPROVE),
  validate({ body: Joi.object({ notes: Joi.string().allow('', null) }) }),
  async (req, res, next) => {
    try {
      const o = await prisma.order.findFirst({ where: { id: req.params.id, status: 'pending_approval' } });
      if (!o) throw AppError.notFound();
      if (req.tenantScope.type === 'company' && o.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
      await prisma.$transaction(async (tx) => {
        await tx.approvalHistory.create({
          data: {
            orderId: o.id,
            approverId: req.user.id,
            status: 'approved',
            notes: req.body.notes,
          },
        });
        await tx.order.update({
          where: { id: o.id },
          data: { status: 'published_for_offers', updatedBy: req.user.id },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: o.id,
            fromStatus: 'pending_approval',
            toStatus: 'published_for_offers',
            changedBy: req.user.id,
            notes: 'Approved',
          },
        });
      });
      return success(res, await prisma.order.findUnique({ where: { id: o.id } }));
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/approvals/:id/reject',
  ...t,
  authorizePermissions(PERMISSIONS.APPROVALS_REJECT),
  validate({ body: Joi.object({ notes: Joi.string().required() }) }),
  async (req, res, next) => {
    try {
      const o = await prisma.order.findFirst({ where: { id: req.params.id, status: 'pending_approval' } });
      if (!o) throw AppError.notFound();
      if (req.tenantScope.type === 'company' && o.companyId !== req.tenantScope.companyId) throw AppError.forbidden();
      await prisma.$transaction(async (tx) => {
        await tx.approvalHistory.create({
          data: {
            orderId: o.id,
            approverId: req.user.id,
            status: 'rejected',
            notes: req.body.notes,
          },
        });
        await tx.order.update({
          where: { id: o.id },
          data: { status: 'rejected', updatedBy: req.user.id },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: o.id,
            fromStatus: 'pending_approval',
            toStatus: 'rejected',
            changedBy: req.user.id,
            notes: req.body.notes,
          },
        });
      });
      return success(res, await prisma.order.findUnique({ where: { id: o.id } }));
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
