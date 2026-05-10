const { prisma } = require('../../lib/prisma');
const { parseListQuery } = require('../../lib/listQuery');
const { AppError } = require('../../utils/AppError');

async function paginate(model, listQuery, extraWhere = {}, queryOptions = {}) {
  const { page, limit, skip, take, orderBy, where } = listQuery;
  const w = { ...where, ...extraWhere };
  const [total, rows] = await Promise.all([
    model.count({ where: w }),
    model.findMany({ where: w, orderBy, skip, take, ...queryOptions }),
  ]);
  return { rows, total, page, limit };
}

// --- Service categories ---
async function listCategories(query) {
  const lq = parseListQuery(query, { searchFields: ['name', 'code'] });
  return paginate(prisma.serviceCategory, lq, {});
}

async function getCategory(id) {
  const row = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('Category not found');
  return row;
}

async function createCategory(data) {
  return prisma.serviceCategory.create({ data });
}

async function updateCategory(id, data) {
  await getCategory(id);
  return prisma.serviceCategory.update({ where: { id }, data });
}

async function deleteCategory(id) {
  await getCategory(id);
  const count = await prisma.serviceType.count({ where: { serviceCategoryId: id } });
  if (count > 0) throw AppError.conflict('Cannot delete category with service types');
  return prisma.serviceCategory.delete({ where: { id } });
}

// --- Service types ---
async function listServiceTypes(query) {
  const lq = parseListQuery(query, { searchFields: ['name', 'code'] });
  if (query.serviceCategoryId) lq.where.serviceCategoryId = query.serviceCategoryId;
  return paginate(prisma.serviceType, lq, {});
}

async function getServiceType(id) {
  const row = await prisma.serviceType.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('Service type not found');
  return row;
}

async function createServiceType(data) {
  await prisma.serviceCategory.findUniqueOrThrow({ where: { id: data.serviceCategoryId } });
  return prisma.serviceType.create({ data });
}

async function updateServiceType(id, data) {
  await getServiceType(id);
  return prisma.serviceType.update({ where: { id }, data });
}

async function deleteServiceType(id) {
  await getServiceType(id);
  return prisma.serviceType.delete({ where: { id } });
}

// --- Vehicle types ---
async function listVehicleTypes(query) {
  const lq = parseListQuery(query, { searchFields: ['name', 'code'] });
  return paginate(prisma.vehicleType, lq, {});
}

async function getVehicleType(id) {
  const row = await prisma.vehicleType.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('Vehicle type not found');
  return row;
}

async function createVehicleType(data) {
  return prisma.vehicleType.create({ data });
}

async function updateVehicleType(id, data) {
  await getVehicleType(id);
  return prisma.vehicleType.update({ where: { id }, data });
}

async function deleteVehicleType(id) {
  await getVehicleType(id);
  return prisma.vehicleType.delete({ where: { id } });
}

// --- Cities ---
async function listCities(query) {
  const lq = parseListQuery(query, { searchFields: ['name', 'code'] });
  return paginate(prisma.city, lq, {});
}

async function getCity(id) {
  const row = await prisma.city.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('City not found');
  return row;
}

async function createCity(data) {
  return prisma.city.create({ data });
}

async function updateCity(id, data) {
  await getCity(id);
  return prisma.city.update({ where: { id }, data });
}

async function deleteCity(id) {
  await getCity(id);
  const areas = await prisma.area.count({ where: { cityId: id } });
  if (areas > 0) throw AppError.conflict('City has areas');
  return prisma.city.delete({ where: { id } });
}

// --- Zones ---
async function listZones(query) {
  const lq = parseListQuery(query, { searchFields: ['name', 'code'] });
  return paginate(prisma.zone, lq, {});
}

async function getZone(id) {
  const row = await prisma.zone.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('Zone not found');
  return row;
}

async function createZone(data) {
  return prisma.zone.create({ data });
}

async function updateZone(id, data) {
  await getZone(id);
  return prisma.zone.update({ where: { id }, data });
}

async function deleteZone(id) {
  await getZone(id);
  return prisma.zone.delete({ where: { id } });
}

// --- Areas ---
async function listAreas(query) {
  const lq = parseListQuery(query, { searchFields: ['name', 'code'] });
  if (query.cityId) lq.where.cityId = query.cityId;
  if (query.zoneId) lq.where.zoneId = query.zoneId;
  return paginate(prisma.area, lq, {});
}

async function getArea(id) {
  const row = await prisma.area.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('Area not found');
  return row;
}

async function createArea(data) {
  return prisma.area.create({ data });
}

async function updateArea(id, data) {
  await getArea(id);
  return prisma.area.update({ where: { id }, data });
}

async function deleteArea(id) {
  await getArea(id);
  return prisma.area.delete({ where: { id } });
}

// --- Branches (provider) ---
async function listBranches(query, tenantScope) {
  const lq = parseListQuery(query, { searchFields: ['name'] });
  if (tenantScope.type === 'provider') {
    lq.where.providerId = tenantScope.providerId;
  } else if (query.providerId) {
    lq.where.providerId = query.providerId;
  }
  return paginate(prisma.branch, lq, {}, { include: { provider: { select: { id: true, name: true, nameAr: true } } } });
}

async function getBranch(id) {
  const row = await prisma.branch.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('Branch not found');
  return row;
}

async function createBranch(data) {
  return prisma.branch.create({ data });
}

async function updateBranch(id, data) {
  await getBranch(id);
  return prisma.branch.update({ where: { id }, data });
}

async function deleteBranch(id) {
  await getBranch(id);
  return prisma.branch.delete({ where: { id } });
}

// --- Pricing settings ---
async function listPricingSettings(query) {
  const lq = parseListQuery(query, { searchFields: ['serviceTypeCode'] });
  return paginate(prisma.pricingSetting, lq, {});
}

async function getPricingSetting(id) {
  const row = await prisma.pricingSetting.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('Pricing setting not found');
  return row;
}

async function createPricingSetting(data) {
  return prisma.pricingSetting.create({ data });
}

async function updatePricingSetting(id, data) {
  await getPricingSetting(id);
  return prisma.pricingSetting.update({ where: { id }, data });
}

async function deletePricingSetting(id) {
  await getPricingSetting(id);
  return prisma.pricingSetting.delete({ where: { id } });
}

// --- App settings ---
async function listAppSettings(query) {
  const lq = parseListQuery(query, { searchFields: ['key'] });
  if (query.group) lq.where.group = query.group;
  return paginate(prisma.appSetting, lq, {});
}

async function getAppSetting(id) {
  const row = await prisma.appSetting.findUnique({ where: { id } });
  if (!row) throw AppError.notFound('App setting not found');
  return row;
}

async function createAppSetting(data) {
  return prisma.appSetting.create({ data });
}

async function updateAppSetting(id, data) {
  await getAppSetting(id);
  return prisma.appSetting.update({ where: { id }, data });
}

async function deleteAppSetting(id) {
  await getAppSetting(id);
  return prisma.appSetting.delete({ where: { id } });
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listServiceTypes,
  getServiceType,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  listVehicleTypes,
  getVehicleType,
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
  listCities,
  getCity,
  createCity,
  updateCity,
  deleteCity,
  listZones,
  getZone,
  createZone,
  updateZone,
  deleteZone,
  listAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea,
  listBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  listPricingSettings,
  getPricingSetting,
  createPricingSetting,
  updatePricingSetting,
  deletePricingSetting,
  listAppSettings,
  getAppSetting,
  createAppSetting,
  updateAppSetting,
  deleteAppSetting,
};
