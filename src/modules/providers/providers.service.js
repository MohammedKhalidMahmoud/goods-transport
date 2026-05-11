const { AppError } = require('../../utils/AppError');
const { parseListQuery } = require('../../lib/listQuery');
const { ProvidersRepository } = require('./providers.repository');

const includeByModel = {
  providerServiceArea: { provider: true, area: true },
  providerDocument: { provider: true },
  providerDriver: { provider: true },
  providerWorker: { provider: true },
  providerVehicle: { provider: true },
  providerUser: { provider: true, user: true },
};

class ProvidersService {
  constructor() {
    this.repo = new ProvidersRepository();
  }

  async listProviders(query, tenantScope) {
    const lq = parseListQuery(query, { searchFields: ['name', 'contactEmail'] });
    const where = { ...lq.where, deletedAt: null };
    if (tenantScope.type === 'provider' && tenantScope.providerId) where.id = tenantScope.providerId;
    const [total, rows] = await Promise.all([
      this.repo.count('provider', where),
      this.repo.findMany('provider', { where, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return { rows, total, page: lq.page, limit: lq.limit };
  }

  async createProvider(body, user) {
    return this.repo.createProvider({ ...body, createdBy: user.id });
  }

  async getProvider(id, tenantScope) {
    const provider = await this.repo.findFirst('provider', { where: { id, deletedAt: null } });
    if (!provider) throw AppError.notFound();
    this.assertProviderScope(tenantScope, provider.id);
    return provider;
  }

  async updateProvider(id, body, tenantScope) {
    this.assertProviderScope(tenantScope, id);
    return this.repo.update('provider', id, body);
  }

  async deleteProvider(id, tenantScope) {
    this.assertProviderScope(tenantScope, id);
    await this.repo.update('provider', id, { deletedAt: new Date() });
  }

  async toggleAvailability(id, tenantScope) {
    this.assertProviderScope(tenantScope, id);
    const current = await this.repo.findUnique('provider', { where: { id } });
    return this.repo.update('provider', id, { isAcceptingOrders: !current.isAcceptingOrders });
  }

  async listSubResource(model, foreignKey, query, tenantScope) {
    const lq = parseListQuery(query, {});
    const where = { ...lq.where };
    if (query[foreignKey]) where[foreignKey] = query[foreignKey];
    if (tenantScope.type === 'provider' && tenantScope.providerId) where[foreignKey] = tenantScope.providerId;
    const [total, rows] = await Promise.all([
      this.repo.count(model, where),
      this.repo.findMany(model, {
        where,
        include: includeByModel[model],
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
      }),
    ]);
    return { rows, total, page: lq.page, limit: lq.limit };
  }

  async createSubResource(model, body, tenantScope, extra = {}) {
    this.assertProviderScope(tenantScope, body.providerId);
    return this.repo.create(model, { ...body, ...extra });
  }

  async getSubResource(model, id, tenantScope, include = undefined) {
    const row = await this.repo.findUnique(model, { where: { id }, include });
    if (!row) throw AppError.notFound();
    this.assertProviderScope(tenantScope, row.providerId);
    return row;
  }

  async updateSubResource(model, id, body, tenantScope) {
    const row = await this.getSubResource(model, id, tenantScope);
    return this.repo.update(model, row.id, body);
  }

  async deleteSubResource(model, id, tenantScope) {
    const row = await this.getSubResource(model, id, tenantScope);
    await this.repo.delete(model, row.id);
  }

  async getWallet(tenantScope) {
    const providerId = this.requireProviderContext(tenantScope);
    return this.repo.findUnique('providerWallet', { where: { providerId } });
  }

  async getEarnings(tenantScope) {
    const providerId = this.requireProviderContext(tenantScope);
    return this.repo.getProviderEarnings(providerId);
  }

  async listSettlements(query, tenantScope) {
    const providerId = this.requireProviderContext(tenantScope);
    const lq = parseListQuery(query, {});
    const where = { ...lq.where, providerId };
    const [total, rows] = await Promise.all([
      this.repo.count('settlement', where),
      this.repo.findMany('settlement', { where, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return { rows, total, page: lq.page, limit: lq.limit };
  }

  requireProviderContext(tenantScope) {
    const providerId = tenantScope.providerId;
    if (!providerId) throw AppError.forbidden();
    return providerId;
  }

  assertProviderScope(tenantScope, providerId) {
    if (tenantScope.type === 'global') return;
    if (tenantScope.type === 'provider' && tenantScope.providerId === providerId) return;
    throw AppError.forbidden();
  }
}

module.exports = new ProvidersService();
