const { parseListQuery } = require('../../lib/listQuery');
const { AppError } = require('../../utils/AppError');
const repository = require('./master-data.repository');

const definitions = {
  category: {
    model: 'serviceCategory',
    searchFields: ['name', 'code'],
    notFound: 'Category not found',
  },
  serviceType: {
    model: 'serviceType',
    searchFields: ['name', 'code'],
    notFound: 'Service type not found',
    beforeList(query, lq) {
      if (query.serviceCategoryId) lq.where.serviceCategoryId = query.serviceCategoryId;
    },
    async beforeCreate(data) {
      const category = await repository.findServiceCategory(data.serviceCategoryId);
      if (!category) throw AppError.notFound('Category not found');
    },
  },
  vehicleType: {
    model: 'vehicleType',
    searchFields: ['name', 'code'],
    notFound: 'Vehicle type not found',
  },
  city: {
    model: 'city',
    searchFields: ['name', 'code'],
    notFound: 'City not found',
  },
  pricingSetting: {
    model: 'pricingSetting',
    searchFields: ['serviceTypeCode'],
    notFound: 'Pricing setting not found',
  },
  appSetting: {
    model: 'appSetting',
    searchFields: ['key'],
    notFound: 'App setting not found',
    beforeList(query, lq) {
      if (query.group) lq.where.group = query.group;
    },
  },
};

function definition(name) {
  return definitions[name];
}

async function listResource(name, query, tenantScope) {
  const def = definition(name);
  const lq = parseListQuery(query, { searchFields: def.searchFields });
  if (def.beforeList) def.beforeList(query, lq, tenantScope);
  const options = def.include ? { include: def.include } : {};
  return repository.paginate(def.model, lq, {}, options);
}

async function getResource(name, id) {
  const def = definition(name);
  const row = await repository.findUnique(def.model, id);
  if (!row) throw AppError.notFound(def.notFound);
  return row;
}

async function createResource(name, data, tenantScope) {
  const def = definition(name);
  if (def.beforeCreate) await def.beforeCreate(data);
  return repository.create(def.model, data);
}

async function updateResource(name, id, data, tenantScope) {
  await getResource(name, id);
  const def = definition(name);
  return repository.update(def.model, id, data);
}

async function deleteResource(name, id, tenantScope) {
  await getResource(name, id);

  if (name === 'category') {
    const count = await repository.countServiceTypesByCategory(id);
    if (count > 0) throw AppError.conflict('Cannot delete category with service types');
  }

  const def = definition(name);
  return repository.delete(def.model, id);
}

const service = {
  listResource,
  getResource,
  createResource,
  updateResource,
  deleteResource,
};

const aliases = {
  Category: 'category',
  ServiceType: 'serviceType',
  VehicleType: 'vehicleType',
  City: 'city',
  PricingSetting: 'pricingSetting',
  AppSetting: 'appSetting',
};

for (const [suffix, resource] of Object.entries(aliases)) {
  service[`list${suffix === 'Category' ? 'Categories' : `${suffix}s`}`] = (query, tenantScope) =>
    listResource(resource, query, tenantScope);
  service[`get${suffix}`] = (id) => getResource(resource, id);
  service[`create${suffix}`] = (data, tenantScope) => createResource(resource, data, tenantScope);
  service[`update${suffix}`] = (id, data, tenantScope) => updateResource(resource, id, data, tenantScope);
  service[`delete${suffix}`] = (id, tenantScope) => deleteResource(resource, id, tenantScope);
}

module.exports = service;
