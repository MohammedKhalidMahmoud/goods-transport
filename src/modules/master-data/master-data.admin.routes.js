const { Router } = require('express');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authorizePermissions, resolveTenantScope } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { PERMISSIONS } = require('../../constants/permissions');
const controller = require('./master-data.controller');
const v = require('./master-data.validation');

const router = Router();

const read = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_READ)];
const write = [authenticateDashboard, authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE)];
const branchWrite = [
  authenticateDashboard,
  authorizePermissions(PERMISSIONS.MASTER_DATA_MANAGE, PERMISSIONS.SETTINGS_MANAGE_PROVIDER),
];

const patchOptional = (schema) => schema.fork(Object.keys(schema.describe().keys || {}), (key) => key.optional());

function registerCrud(path, resource, schema, middleware = {}) {
  const readMiddleware = middleware.read || read;
  const writeMiddleware = middleware.write || write;
  const listMiddleware = middleware.list || readMiddleware;
  const itemMiddleware = middleware.item || readMiddleware;
  const extra = middleware.scope ? [resolveTenantScope] : [];

  router.get(path, ...listMiddleware, ...extra, controller.list(resource, middleware.label));
  router.get(`${path}/:id`, ...itemMiddleware, ...extra, validate({ params: v.idParam }), controller.get(resource));
  router.post(path, ...writeMiddleware, ...extra, validate({ body: schema }), controller.create(resource));
  router.patch(
    `${path}/:id`,
    ...writeMiddleware,
    ...extra,
    validate({ params: v.idParam, body: patchOptional(schema) }),
    controller.update(resource)
  );
  router.delete(`${path}/:id`, ...writeMiddleware, ...extra, validate({ params: v.idParam }), controller.remove(resource));
}

registerCrud('/branches', 'branch', v.branchBody, {
  read,
  write: branchWrite,
  scope: true,
  label: 'Branches',
});
registerCrud('/service-categories', 'category', v.categoryBody);
registerCrud('/service-types', 'serviceType', v.serviceTypeBody);
registerCrud('/vehicle-types', 'vehicleType', v.vehicleTypeBody);
registerCrud('/cities', 'city', v.cityBody);
registerCrud('/zones', 'zone', v.zoneBody);
registerCrud('/areas', 'area', v.areaBody);
registerCrud('/pricing-settings', 'pricingSetting', v.pricingBody);
registerCrud('/app-settings', 'appSetting', v.appSettingBody);

module.exports = router;
