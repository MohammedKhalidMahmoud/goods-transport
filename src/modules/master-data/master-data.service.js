const { parseListQuery } = require('../../lib/listQuery');
const { AppError } = require('../../utils/AppError');
const repository = require('./master-data.repository');

const definitions = {
  service: {
    model: 'service',
    searchFields: ['name', 'code'],
    notFound: 'Service not found',
  },
  city: {
    model: 'city',
    searchFields: ['name', 'code'],
    notFound: 'City not found',
  },
  pricingSetting: {
    model: 'pricingSetting',
    searchFields: ['serviceCode'],
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
  Service: 'service',
  City: 'city',
  PricingSetting: 'pricingSetting',
  AppSetting: 'appSetting',
};

for (const [suffix, resource] of Object.entries(aliases)) {
  service[`list${suffix}s`] = (query, tenantScope) =>
    listResource(resource, query, tenantScope);
  service[`get${suffix}`] = (id) => getResource(resource, id);
  service[`create${suffix}`] = (data, tenantScope) => createResource(resource, data, tenantScope);
  service[`update${suffix}`] = (id, data, tenantScope) => updateResource(resource, id, data, tenantScope);
  service[`delete${suffix}`] = (id, tenantScope) => deleteResource(resource, id, tenantScope);
}

module.exports = service;
