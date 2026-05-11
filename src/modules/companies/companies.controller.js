const companiesService = require('./companies.service');
const { success, paginated } = require('../../utils/response');

class CompaniesController {
  listCompanies = this.paginatedHandler((req) => companiesService.listCompanies(req.query, req.tenantScope));
  createCompany = this.createdHandler((req) => companiesService.createCompany(req.body, req.user));
  getCompany = this.successHandler((req) => companiesService.getCompany(req.params.id, req.tenantScope));
  updateCompany = this.successHandler((req) => companiesService.updateCompany(req.params.id, req.body, req.tenantScope));
  deleteCompany = this.emptyHandler((req) => companiesService.deleteCompany(req.params.id, req.tenantScope), 'Deleted');

  listBranches = this.paginatedHandler((req) => companiesService.listBranches(req.query, req.tenantScope));
  createBranch = this.createdHandler((req) => companiesService.createBranch(req.body, req.tenantScope));
  getBranch = this.successHandler((req) => companiesService.getBranch(req.params.id, req.tenantScope));
  updateBranch = this.successHandler((req) => companiesService.updateBranch(req.params.id, req.body, req.tenantScope));
  deleteBranch = this.emptyHandler((req) => companiesService.deleteBranch(req.params.id, req.tenantScope), 'Deleted');

  listCompanyUsers = this.paginatedHandler((req) => companiesService.listCompanyUsers(req.query, req.tenantScope));
  createCompanyUser = this.createdHandler((req) => companiesService.createCompanyUser(req.body, req.tenantScope));
  getCompanyUser = this.successHandler((req) => companiesService.getCompanyUser(req.params.id, req.tenantScope));
  updateCompanyUser = this.successHandler((req) => companiesService.updateCompanyUser(req.params.id, req.body, req.tenantScope));
  deleteCompanyUser = this.emptyHandler((req) => companiesService.deleteCompanyUser(req.params.id, req.tenantScope), 'Deleted');

  listBillingProfiles = this.successHandler((req) => companiesService.listBillingProfiles(req.query, req.tenantScope));
  createBillingProfile = this.createdHandler((req) => companiesService.createBillingProfile(req.body, req.tenantScope));
  getBillingProfile = this.successHandler((req) => companiesService.getBillingProfile(req.params.id, req.tenantScope));
  updateBillingProfile = this.successHandler((req) => companiesService.updateBillingProfile(req.params.id, req.body, req.tenantScope));

  listApprovalRules = this.successHandler((req) => companiesService.listApprovalRules(req.query, req.tenantScope));
  createApprovalRule = this.createdHandler((req) => companiesService.createApprovalRule(req.body, req.tenantScope));
  updateApprovalRule = this.successHandler((req) => companiesService.updateApprovalRule(req.params.id, req.body, req.tenantScope));
  deleteApprovalRule = this.emptyHandler((req) => companiesService.deleteApprovalRule(req.params.id, req.tenantScope), 'Deleted');

  listApprovals = this.successHandler((req) => companiesService.listApprovals(req.tenantScope));
  getApproval = this.successHandler((req) => companiesService.getApproval(req.params.id, req.tenantScope));
  approveOrder = this.successHandler((req) => companiesService.approveOrder(req.params.id, req.body, req.user, req.tenantScope));
  rejectOrder = this.successHandler((req) => companiesService.rejectOrder(req.params.id, req.body, req.user, req.tenantScope));

  successHandler(fn) {
    return async (req, res, next) => {
      try {
        return success(res, await fn(req));
      } catch (err) {
        next(err);
      }
    };
  }

  createdHandler(fn) {
    return async (req, res, next) => {
      try {
        return success(res, await fn(req), 'Created', 201);
      } catch (err) {
        next(err);
      }
    };
  }

  emptyHandler(fn, message) {
    return async (req, res, next) => {
      try {
        await fn(req);
        return success(res, null, message);
      } catch (err) {
        next(err);
      }
    };
  }

  paginatedHandler(fn) {
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

module.exports = new CompaniesController();
