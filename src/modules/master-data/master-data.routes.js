const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { success, paginated } = require('../../utils/response');
const { PERMISSIONS } = require('../../constants/permissions');
const svc = require('./master-data.service');
const v = require('./master-data.validation');

const router = Router();

const read = [authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];
const write = [authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE)];

// Manual routes for branches (tenant + providerId rules)
const branchWrite = [
  authenticate,
  authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE, PERMISSIONS.SETTINGS_MANAGE_PROVIDER),
];

router.get('/branches', authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_READ), resolveTenantScope, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listBranches(req.query, req.tenantScope);
    return paginated(res, rows, { page, limit, total }, 'Branches');
  } catch (e) {
    next(e);
  }
});
router.get('/branches/:id', authenticate, authorizePermissions(PERMISSIONS.MASTER_DATA_READ), resolveTenantScope, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    const b = await svc.getBranch(req.params.id);
    return success(res, b);
  } catch (e) {
    next(e);
  }
});
router.post('/branches', ...branchWrite, resolveTenantScope, validate({ body: v.branchBody }), async (req, res, next) => {
  try {
    if (req.tenantScope.type === 'provider' && req.body.providerId !== req.tenantScope.providerId) {
      const { AppError } = require('../../utils/AppError');
      throw AppError.forbidden('Cannot create branch for another provider');
    }
    const row = await svc.createBranch(req.body);
    return success(res, row, 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/branches/:id', ...branchWrite, resolveTenantScope, validate({ params: v.idParam, body: v.branchBody.fork(['providerId'], (x) => x.optional()) }), async (req, res, next) => {
  try {
    const existing = await svc.getBranch(req.params.id);
    if (req.tenantScope.type === 'provider' && existing.providerId !== req.tenantScope.providerId) {
      const { AppError } = require('../../utils/AppError');
      throw AppError.forbidden();
    }
    const row = await svc.updateBranch(req.params.id, req.body);
    return success(res, row, 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/branches/:id', ...branchWrite, resolveTenantScope, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    const existing = await svc.getBranch(req.params.id);
    if (req.tenantScope.type === 'provider' && existing.providerId !== req.tenantScope.providerId) {
      const { AppError } = require('../../utils/AppError');
      throw AppError.forbidden();
    }
    await svc.deleteBranch(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

// Generic CRUD mounts (paths use kebab-case as per API spec)
const patchOptional = (schema) => schema.fork(Object.keys(schema.describe().keys || {}), (k) => k.optional());

router.get('/service-categories', read, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listCategories(req.query);
    return paginated(res, rows, { page, limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});
router.get('/service-categories/:id', read, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    return success(res, await svc.getCategory(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/service-categories', write, validate({ body: v.categoryBody }), async (req, res, next) => {
  try {
    return success(res, await svc.createCategory(req.body), 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/service-categories/:id', write, validate({ params: v.idParam, body: patchOptional(v.categoryBody) }), async (req, res, next) => {
  try {
    return success(res, await svc.updateCategory(req.params.id, req.body), 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/service-categories/:id', write, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    await svc.deleteCategory(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/service-types', read, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listServiceTypes(req.query);
    return paginated(res, rows, { page, limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});
router.get('/service-types/:id', read, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    return success(res, await svc.getServiceType(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/service-types', write, validate({ body: v.serviceTypeBody }), async (req, res, next) => {
  try {
    return success(res, await svc.createServiceType(req.body), 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/service-types/:id', write, validate({ params: v.idParam, body: patchOptional(v.serviceTypeBody) }), async (req, res, next) => {
  try {
    return success(res, await svc.updateServiceType(req.params.id, req.body), 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/service-types/:id', write, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    await svc.deleteServiceType(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/vehicle-types', read, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listVehicleTypes(req.query);
    return paginated(res, rows, { page, limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});
router.get('/vehicle-types/:id', read, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    return success(res, await svc.getVehicleType(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/vehicle-types', write, validate({ body: v.vehicleTypeBody }), async (req, res, next) => {
  try {
    return success(res, await svc.createVehicleType(req.body), 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/vehicle-types/:id', write, validate({ params: v.idParam, body: patchOptional(v.vehicleTypeBody) }), async (req, res, next) => {
  try {
    return success(res, await svc.updateVehicleType(req.params.id, req.body), 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/vehicle-types/:id', write, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    await svc.deleteVehicleType(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/cities', read, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listCities(req.query);
    return paginated(res, rows, { page, limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});
router.get('/cities/:id', read, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    return success(res, await svc.getCity(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/cities', write, validate({ body: v.cityBody }), async (req, res, next) => {
  try {
    return success(res, await svc.createCity(req.body), 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/cities/:id', write, validate({ params: v.idParam, body: patchOptional(v.cityBody) }), async (req, res, next) => {
  try {
    return success(res, await svc.updateCity(req.params.id, req.body), 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/cities/:id', write, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    await svc.deleteCity(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/zones', read, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listZones(req.query);
    return paginated(res, rows, { page, limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});
router.get('/zones/:id', read, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    return success(res, await svc.getZone(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/zones', write, validate({ body: v.zoneBody }), async (req, res, next) => {
  try {
    return success(res, await svc.createZone(req.body), 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/zones/:id', write, validate({ params: v.idParam, body: patchOptional(v.zoneBody) }), async (req, res, next) => {
  try {
    return success(res, await svc.updateZone(req.params.id, req.body), 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/zones/:id', write, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    await svc.deleteZone(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/areas', read, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listAreas(req.query);
    return paginated(res, rows, { page, limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});
router.get('/areas/:id', read, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    return success(res, await svc.getArea(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/areas', write, validate({ body: v.areaBody }), async (req, res, next) => {
  try {
    return success(res, await svc.createArea(req.body), 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/areas/:id', write, validate({ params: v.idParam, body: patchOptional(v.areaBody) }), async (req, res, next) => {
  try {
    return success(res, await svc.updateArea(req.params.id, req.body), 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/areas/:id', write, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    await svc.deleteArea(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/pricing-settings', read, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listPricingSettings(req.query);
    return paginated(res, rows, { page, limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});
router.get('/pricing-settings/:id', read, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    return success(res, await svc.getPricingSetting(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/pricing-settings', write, validate({ body: v.pricingBody }), async (req, res, next) => {
  try {
    return success(res, await svc.createPricingSetting(req.body), 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/pricing-settings/:id', write, validate({ params: v.idParam, body: patchOptional(v.pricingBody) }), async (req, res, next) => {
  try {
    return success(res, await svc.updatePricingSetting(req.params.id, req.body), 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/pricing-settings/:id', write, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    await svc.deletePricingSetting(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

router.get('/app-settings', read, async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await svc.listAppSettings(req.query);
    return paginated(res, rows, { page, limit, total }, 'OK');
  } catch (e) {
    next(e);
  }
});
router.get('/app-settings/:id', read, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    return success(res, await svc.getAppSetting(req.params.id));
  } catch (e) {
    next(e);
  }
});
router.post('/app-settings', write, validate({ body: v.appSettingBody }), async (req, res, next) => {
  try {
    return success(res, await svc.createAppSetting(req.body), 'Created', 201);
  } catch (e) {
    next(e);
  }
});
router.patch('/app-settings/:id', write, validate({ params: v.idParam, body: patchOptional(v.appSettingBody) }), async (req, res, next) => {
  try {
    return success(res, await svc.updateAppSetting(req.params.id, req.body), 'Updated');
  } catch (e) {
    next(e);
  }
});
router.delete('/app-settings/:id', write, validate({ params: v.idParam }), async (req, res, next) => {
  try {
    await svc.deleteAppSetting(req.params.id);
    return success(res, null, 'Deleted');
  } catch (e) {
    next(e);
  }
});

module.exports = router;
