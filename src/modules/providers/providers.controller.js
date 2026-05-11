const providersService = require('./providers.service');
const { success, paginated } = require('../../utils/response');

class ProvidersController {
  listProviders = this.paginated((req) => providersService.listProviders(req.query, req.tenantScope));
  createProvider = this.created((req) => providersService.createProvider(req.body, req.user));
  getProvider = this.success((req) => providersService.getProvider(req.params.id, req.tenantScope));
  updateProvider = this.success((req) => providersService.updateProvider(req.params.id, req.body, req.tenantScope));
  deleteProvider = this.empty((req) => providersService.deleteProvider(req.params.id, req.tenantScope), 'Deleted');
  toggleAvailability = this.success((req) => providersService.toggleAvailability(req.params.id, req.tenantScope));

  listProviderUsers = this.paginated((req) => providersService.listSubResource('providerUser', 'providerId', req.query, req.tenantScope));
  createProviderUser = this.created((req) => providersService.createSubResource('providerUser', req.body, req.tenantScope));
  getProviderUser = this.success((req) => providersService.getSubResource('providerUser', req.params.id, req.tenantScope, { user: true }));
  updateProviderUser = this.success((req) => providersService.updateSubResource('providerUser', req.params.id, req.body, req.tenantScope));
  deleteProviderUser = this.empty((req) => providersService.deleteSubResource('providerUser', req.params.id, req.tenantScope), 'Deleted');

  listProviderDocuments = this.paginated((req) => providersService.listSubResource('providerDocument', 'providerId', req.query, req.tenantScope));
  createProviderDocument = this.created((req) => providersService.createSubResource('providerDocument', req.body, req.tenantScope, { uploadedBy: req.user.id }));
  getProviderDocument = this.success((req) => providersService.getSubResource('providerDocument', req.params.id, req.tenantScope, { provider: true }));
  updateProviderDocument = this.success((req) => providersService.updateSubResource('providerDocument', req.params.id, req.body, req.tenantScope));
  deleteProviderDocument = this.empty((req) => providersService.deleteSubResource('providerDocument', req.params.id, req.tenantScope), 'Deleted');

  listProviderAvailability = this.paginated((req) => providersService.listSubResource('providerAvailability', 'providerId', req.query, req.tenantScope));
  createProviderAvailability = this.created((req) => providersService.createSubResource('providerAvailability', req.body, req.tenantScope));

  listProviderDrivers = this.paginated((req) => providersService.listSubResource('providerDriver', 'providerId', req.query, req.tenantScope));
  createProviderDriver = this.created((req) => providersService.createSubResource('providerDriver', req.body, req.tenantScope));
  getProviderDriver = this.success((req) => providersService.getSubResource('providerDriver', req.params.id, req.tenantScope));
  updateProviderDriver = this.success((req) => providersService.updateSubResource('providerDriver', req.params.id, req.body, req.tenantScope));
  deleteProviderDriver = this.empty((req) => providersService.deleteSubResource('providerDriver', req.params.id, req.tenantScope), 'Deleted');

  listProviderWorkers = this.paginated((req) => providersService.listSubResource('providerWorker', 'providerId', req.query, req.tenantScope));
  createProviderWorker = this.created((req) => providersService.createSubResource('providerWorker', req.body, req.tenantScope));
  getProviderWorker = this.success((req) => providersService.getSubResource('providerWorker', req.params.id, req.tenantScope));
  updateProviderWorker = this.success((req) => providersService.updateSubResource('providerWorker', req.params.id, req.body, req.tenantScope));
  deleteProviderWorker = this.empty((req) => providersService.deleteSubResource('providerWorker', req.params.id, req.tenantScope), 'Deleted');

  getWallet = this.success((req) => providersService.getWallet(req.tenantScope));
  getEarnings = this.success((req) => providersService.getEarnings(req.tenantScope));
  listSettlements = this.paginated((req) => providersService.listSettlements(req.query, req.tenantScope));

  success(fn) {
    return async (req, res, next) => {
      try {
        return success(res, await fn(req));
      } catch (err) {
        next(err);
      }
    };
  }

  created(fn) {
    return async (req, res, next) => {
      try {
        return success(res, await fn(req), 'Created', 201);
      } catch (err) {
        next(err);
      }
    };
  }

  empty(fn, message) {
    return async (req, res, next) => {
      try {
        await fn(req);
        return success(res, null, message);
      } catch (err) {
        next(err);
      }
    };
  }

  paginated(fn) {
    return async (req, res, next) => {
      try {
        const result = await fn(req);
        return paginated(res, result.rows, { page: result.page, limit: result.limit, total: result.total }, 'OK');
      } catch (err) {
        next(err);
      }
    };
  }
}

module.exports = new ProvidersController();
