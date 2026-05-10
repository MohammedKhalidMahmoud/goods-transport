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
const router = Router();
const t = [authenticate, resolveTenantScope];

function assertProviderScope(ts, providerId) {
  if (ts.type === 'global') return;
  if (ts.type === 'provider') {
    if (ts.providerId !== providerId) throw AppError.forbidden();
    return;
  }
  throw AppError.forbidden();
}

router.get('/providers', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_READ, PERMISSIONS.PROVIDERS_READ_OWN), async (req, res, next) => {
  try {
    const lq = parseListQuery(req.query, { searchFields: ['name', 'contactEmail'] });
    let w = { ...lq.where, deletedAt: null };
    if (req.tenantScope.type === 'provider' && req.tenantScope.providerId) {
      w.id = req.tenantScope.providerId;
    }
    const [total, rows] = await Promise.all([
      prisma.provider.count({ where: w }),
      prisma.provider.findMany({ where: w, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/providers',
  ...t,
  authorizePermissions(PERMISSIONS.PROVIDERS_CREATE),
  validate({
    body: Joi.object({
      name: Joi.string().required(),
      contactEmail: Joi.string().email().required(),
      contactPhone: Joi.string().required(),
      nameAr: Joi.string().allow('', null),
      address: Joi.string().allow('', null),
      taxNumber: Joi.string().allow('', null),
      licenseNumber: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      const p = await prisma.provider.create({ data: { ...req.body, createdBy: req.user.id } });
      await prisma.providerWallet.create({ data: { providerId: p.id } });
      return success(res, p, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/providers/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_READ, PERMISSIONS.PROVIDERS_READ_OWN), async (req, res, next) => {
  try {
    const p = await prisma.provider.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!p) throw AppError.notFound();
    assertProviderScope(req.tenantScope, p.id);
    return success(res, p);
  } catch (e) {
    next(e);
  }
});

const providerPatchBody = Joi.object({
  name: Joi.string(),
  nameAr: Joi.string().allow('', null),
  contactEmail: Joi.string().email(),
  contactPhone: Joi.string(),
  address: Joi.string().allow('', null),
  taxNumber: Joi.string().allow('', null),
  licenseNumber: Joi.string().allow('', null),
  status: Joi.string(),
  isVerified: Joi.boolean(),
  isAcceptingOrders: Joi.boolean(),
}).min(1);

router.patch(
  '/providers/:id',
  ...t,
  authorizePermissions(PERMISSIONS.PROVIDERS_UPDATE, PERMISSIONS.PROVIDERS_UPDATE_OWN),
  validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: providerPatchBody }),
  async (req, res, next) => {
    try {
      assertProviderScope(req.tenantScope, req.params.id);
      const p = await prisma.provider.update({ where: { id: req.params.id }, data: req.body });
      return success(res, p);
    } catch (e) {
      next(e);
    }
  }
);

router.delete('/providers/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_DELETE), async (req, res, next) => {
  try {
    assertProviderScope(req.tenantScope, req.params.id);
    await prisma.provider.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.post('/providers/:id/toggle-availability', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_UPDATE_OWN, PERMISSIONS.PROVIDERS_UPDATE), async (req, res, next) => {
  try {
    assertProviderScope(req.tenantScope, req.params.id);
    const cur = await prisma.provider.findUnique({ where: { id: req.params.id } });
    const p = await prisma.provider.update({
      where: { id: req.params.id },
      data: { isAcceptingOrders: !cur.isAcceptingOrders },
    });
    return success(res, p);
  } catch (e) {
    next(e);
  }
});

const subList = (path, model, fk) => {
  router.get(path, ...t, authorizePermissions(PERMISSIONS.PROVIDERS_READ_OWN, PERMISSIONS.PROVIDERS_READ), async (req, res, next) => {
    try {
      const lq = parseListQuery(req.query, {});
      const w = { ...lq.where };
      if (req.query[fk]) w[fk] = req.query[fk];
      if (req.tenantScope.type === 'provider' && req.tenantScope.providerId) w[fk] = req.tenantScope.providerId;
      const includeByModel = {
        providerServiceArea: { provider: true, area: true },
        providerDocument: { provider: true },
        providerDriver: { provider: true },
        providerWorker: { provider: true },
        providerVehicle: { provider: true },
        providerUser: { provider: true, user: { include: { profile: true } } },
      };
      const [total, rows] = await Promise.all([
        prisma[model].count({ where: w }),
        prisma[model].findMany({
          where: w,
          include: includeByModel[model],
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
};

subList('/provider-users', 'providerUser', 'providerId');
subList('/provider-documents', 'providerDocument', 'providerId');
subList('/provider-service-areas', 'providerServiceArea', 'providerId');
subList('/provider-availability', 'providerAvailability', 'providerId');
subList('/provider-drivers', 'providerDriver', 'providerId');
subList('/provider-workers', 'providerWorker', 'providerId');
subList('/provider-vehicles', 'providerVehicle', 'providerId');

router.post(
  '/provider-availability',
  ...t,
  authorizePermissions(PERMISSIONS.PROVIDERS_UPDATE_OWN),
  validate({
    body: Joi.object({
      providerId: Joi.string().uuid().required(),
      dayOfWeek: Joi.number().integer().min(0).max(6).required(),
      startTime: Joi.string().required(),
      endTime: Joi.string().required(),
    }),
  }),
  async (req, res, next) => {
    try {
      assertProviderScope(req.tenantScope, req.body.providerId);
      const row = await prisma.providerAvailability.create({ data: req.body });
      return success(res, row, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/provider-users',
  ...t,
  authorizePermissions(PERMISSIONS.USERS_CREATE, PERMISSIONS.PROVIDERS_UPDATE_OWN),
  validate({
    body: Joi.object({
      providerId: Joi.string().uuid().required(),
      userId: Joi.string().uuid().required(),
      role: Joi.string(),
      isActive: Joi.boolean(),
    }),
  }),
  async (req, res, next) => {
    try {
      assertProviderScope(req.tenantScope, req.body.providerId);
      const row = await prisma.providerUser.create({ data: req.body });
      return success(res, row, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/provider-users/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_READ_OWN), async (req, res, next) => {
  try {
    const row = await prisma.providerUser.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!row) throw AppError.notFound();
    assertProviderScope(req.tenantScope, row.providerId);
    return success(res, row);
  } catch (e) {
    next(e);
  }
});

router.patch('/provider-users/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_UPDATE_OWN), async (req, res, next) => {
  try {
    const row = await prisma.providerUser.findUnique({ where: { id: req.params.id } });
    if (!row) throw AppError.notFound();
    assertProviderScope(req.tenantScope, row.providerId);
    const u = await prisma.providerUser.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/provider-users/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_UPDATE_OWN), async (req, res, next) => {
  try {
    const row = await prisma.providerUser.findUnique({ where: { id: req.params.id } });
    if (!row) throw AppError.notFound();
    assertProviderScope(req.tenantScope, row.providerId);
    await prisma.providerUser.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/provider-documents',
  ...t,
  authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_DOCUMENTS),
  validate({
    body: Joi.object({
      providerId: Joi.string().uuid().required(),
      documentType: Joi.string().required(),
      fileName: Joi.string().required(),
      originalName: Joi.string().required(),
      filePath: Joi.string().required(),
      mimeType: Joi.string().required(),
      fileSize: Joi.number().integer().required(),
    }),
  }),
  async (req, res, next) => {
    try {
      assertProviderScope(req.tenantScope, req.body.providerId);
      const d = await prisma.providerDocument.create({
        data: { ...req.body, uploadedBy: req.user.id },
      });
      return success(res, d, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/provider-documents/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_READ_OWN, PERMISSIONS.PROVIDERS_READ), async (req, res, next) => {
  try {
    const d = await prisma.providerDocument.findUnique({ where: { id: req.params.id }, include: { provider: true } });
    if (!d) throw AppError.notFound();
    assertProviderScope(req.tenantScope, d.providerId);
    return success(res, d);
  } catch (e) {
    next(e);
  }
});

router.patch('/provider-documents/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_DOCUMENTS), async (req, res, next) => {
  try {
    const d = await prisma.providerDocument.findUnique({ where: { id: req.params.id } });
    if (!d) throw AppError.notFound();
    assertProviderScope(req.tenantScope, d.providerId);
    const u = await prisma.providerDocument.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/provider-documents/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_DOCUMENTS), async (req, res, next) => {
  try {
    const d = await prisma.providerDocument.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, d.providerId);
    await prisma.providerDocument.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/provider-service-areas',
  ...t,
  authorizePermissions(PERMISSIONS.PROVIDERS_UPDATE_OWN),
  validate({
    body: Joi.object({ providerId: Joi.string().uuid().required(), areaId: Joi.string().uuid().required() }),
  }),
  async (req, res, next) => {
    try {
      assertProviderScope(req.tenantScope, req.body.providerId);
      const row = await prisma.providerServiceArea.create({ data: req.body });
      return success(res, row, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch('/provider-service-areas/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_UPDATE_OWN), async (req, res, next) => {
  try {
    const row = await prisma.providerServiceArea.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    const u = await prisma.providerServiceArea.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/provider-service-areas/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_UPDATE_OWN), async (req, res, next) => {
  try {
    const row = await prisma.providerServiceArea.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    await prisma.providerServiceArea.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/provider-drivers',
  ...t,
  authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_WORKERS),
  validate({
    body: Joi.object({
      providerId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      phone: Joi.string().required(),
      userId: Joi.string().uuid().allow(null),
      licenseNumber: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      assertProviderScope(req.tenantScope, req.body.providerId);
      const row = await prisma.providerDriver.create({ data: req.body });
      return success(res, row, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/provider-drivers/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_READ_OWN), async (req, res, next) => {
  try {
    const row = await prisma.providerDriver.findUnique({ where: { id: req.params.id } });
    if (!row) throw AppError.notFound();
    assertProviderScope(req.tenantScope, row.providerId);
    return success(res, row);
  } catch (e) {
    next(e);
  }
});

router.patch('/provider-drivers/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_WORKERS), async (req, res, next) => {
  try {
    const row = await prisma.providerDriver.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    const u = await prisma.providerDriver.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/provider-drivers/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_WORKERS), async (req, res, next) => {
  try {
    const row = await prisma.providerDriver.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    await prisma.providerDriver.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/provider-workers',
  ...t,
  authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_WORKERS),
  validate({
    body: Joi.object({
      providerId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      phone: Joi.string().allow('', null),
    }),
  }),
  async (req, res, next) => {
    try {
      assertProviderScope(req.tenantScope, req.body.providerId);
      const row = await prisma.providerWorker.create({ data: req.body });
      return success(res, row, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/provider-workers/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_READ_OWN), async (req, res, next) => {
  try {
    const row = await prisma.providerWorker.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    return success(res, row);
  } catch (e) {
    next(e);
  }
});

router.patch('/provider-workers/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_WORKERS), async (req, res, next) => {
  try {
    const row = await prisma.providerWorker.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    const u = await prisma.providerWorker.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/provider-workers/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_WORKERS), async (req, res, next) => {
  try {
    const row = await prisma.providerWorker.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    await prisma.providerWorker.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.post(
  '/provider-vehicles',
  ...t,
  authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_VEHICLES),
  validate({
    body: Joi.object({
      providerId: Joi.string().uuid().required(),
      vehicleTypeId: Joi.string().uuid().required(),
      plateNumber: Joi.string().required(),
    }),
  }),
  async (req, res, next) => {
    try {
      assertProviderScope(req.tenantScope, req.body.providerId);
      const row = await prisma.providerVehicle.create({ data: req.body });
      return success(res, row, 'Created', 201);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/provider-vehicles/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_READ_OWN), async (req, res, next) => {
  try {
    const row = await prisma.providerVehicle.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    return success(res, row);
  } catch (e) {
    next(e);
  }
});

router.patch('/provider-vehicles/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_VEHICLES), async (req, res, next) => {
  try {
    const row = await prisma.providerVehicle.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    const u = await prisma.providerVehicle.update({ where: { id: req.params.id }, data: req.body });
    return success(res, u);
  } catch (e) {
    next(e);
  }
});

router.delete('/provider-vehicles/:id', ...t, authorizePermissions(PERMISSIONS.PROVIDERS_MANAGE_VEHICLES), async (req, res, next) => {
  try {
    const row = await prisma.providerVehicle.findUnique({ where: { id: req.params.id } });
    assertProviderScope(req.tenantScope, row.providerId);
    await prisma.providerVehicle.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/provider-wallet', ...t, authorizePermissions(PERMISSIONS.SETTLEMENTS_READ_OWN), async (req, res, next) => {
  try {
    const pid = req.tenantScope.providerId;
    if (!pid) throw AppError.forbidden();
    const w = await prisma.providerWallet.findUnique({ where: { providerId: pid } });
    return success(res, w);
  } catch (e) {
    next(e);
  }
});

router.get('/provider-earnings', ...t, authorizePermissions(PERMISSIONS.ANALYTICS_READ_PROVIDER, PERMISSIONS.SETTLEMENTS_READ_OWN), async (req, res, next) => {
  try {
    const pid = req.tenantScope.providerId;
    if (!pid) throw AppError.forbidden();
    const [commAgg, wallet] = await Promise.all([
      prisma.commission.aggregate({
        where: { providerId: pid },
        _sum: { amount: true },
      }),
      prisma.providerWallet.findUnique({ where: { providerId: pid } }),
    ]);
    return success(res, {
      wallet,
      commissionsTotal: commAgg._sum.amount || 0,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/provider-settlements', ...t, authorizePermissions(PERMISSIONS.SETTLEMENTS_READ_OWN), async (req, res, next) => {
  try {
    const pid = req.tenantScope.providerId;
    if (!pid) throw AppError.forbidden();
    const lq = parseListQuery(req.query, {});
    const w = { ...lq.where, providerId: pid };
    const [total, rows] = await Promise.all([
      prisma.settlement.count({ where: w }),
      prisma.settlement.findMany({ where: w, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return paginated(res, rows, { page: lq.page, limit: lq.limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});

module.exports = router;
