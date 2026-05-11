const { AppError } = require('../../utils/AppError');
const { parseListQuery } = require('../../lib/listQuery');
const { mergeWhere, companyTenantWhere } = require('../../utils/tenantQuery');
const { CompaniesRepository } = require('./companies.repository');

class CompaniesService {
  constructor() {
    this.repo = new CompaniesRepository();
  }

  async listCompanies(query, tenantScope) {
    const lq = parseListQuery(query, { searchFields: ['name', 'contactEmail'] });
    let where = { ...lq.where, deletedAt: null };
    if (tenantScope.type === 'company') {
      where = mergeWhere(where, companyTenantWhere(tenantScope) || {});
    }
    const [total, rows] = await Promise.all([
      this.repo.count('company', where),
      this.repo.findMany('company', { where, orderBy: lq.orderBy, skip: lq.skip, take: lq.take }),
    ]);
    return { rows, total, page: lq.page, limit: lq.limit };
  }

  async createCompany(body, user) {
    return this.repo.create('company', { ...body, createdBy: user.id });
  }

  async getCompany(id, tenantScope) {
    const company = await this.repo.findFirst('company', { where: { id, deletedAt: null } });
    if (!company) throw AppError.notFound();
    this.assertCompanyScope(company.id, tenantScope);
    return company;
  }

  async updateCompany(id, body, tenantScope) {
    this.assertCompanyScope(id, tenantScope);
    return this.repo.update('company', id, body);
  }

  async deleteCompany(id, tenantScope) {
    this.assertCompanyScope(id, tenantScope);
    await this.repo.update('company', id, { deletedAt: new Date() });
  }

  async listBranches(query, tenantScope) {
    const lq = parseListQuery(query, { searchFields: ['name'] });
    const where = { ...lq.where };
    if (tenantScope.type === 'company') where.companyId = tenantScope.companyId;
    else if (query.companyId) where.companyId = query.companyId;
    const [total, rows] = await Promise.all([
      this.repo.count('companyBranch', where),
      this.repo.findMany('companyBranch', {
        where,
        include: { company: { select: { id: true, name: true, nameAr: true } } },
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
      }),
    ]);
    return { rows, total, page: lq.page, limit: lq.limit };
  }

  async createBranch(body, tenantScope) {
    this.assertCompanyScope(body.companyId, tenantScope);
    return this.repo.create('companyBranch', body);
  }

  async getBranch(id, tenantScope) {
    const branch = await this.repo.findUnique('companyBranch', { where: { id } });
    if (!branch) throw AppError.notFound();
    this.assertCompanyScope(branch.companyId, tenantScope);
    return branch;
  }

  async updateBranch(id, body, tenantScope) {
    const branch = await this.getBranch(id, tenantScope);
    return this.repo.update('companyBranch', branch.id, body);
  }

  async deleteBranch(id, tenantScope) {
    const branch = await this.getBranch(id, tenantScope);
    await this.repo.delete('companyBranch', branch.id);
  }

  async listCompanyUsers(query, tenantScope) {
    const lq = parseListQuery(query, {});
    const where = { ...lq.where };
    if (tenantScope.type === 'company') where.companyId = tenantScope.companyId;
    else if (query.companyId) where.companyId = query.companyId;
    const [total, rows] = await Promise.all([
      this.repo.count('companyUser', where),
      this.repo.findMany('companyUser', {
        where,
        include: { user: true, company: { select: { id: true, name: true, nameAr: true } } },
        orderBy: lq.orderBy,
        skip: lq.skip,
        take: lq.take,
      }),
    ]);
    return { rows, total, page: lq.page, limit: lq.limit };
  }

  async createCompanyUser(body, tenantScope) {
    this.assertCompanyScope(body.companyId, tenantScope);
    return this.repo.create('companyUser', body);
  }

  async getCompanyUser(id, tenantScope) {
    const companyUser = await this.repo.findUnique('companyUser', {
      where: { id },
      include: { user: true },
    });
    if (!companyUser) throw AppError.notFound();
    this.assertCompanyScope(companyUser.companyId, tenantScope);
    return companyUser;
  }

  async updateCompanyUser(id, body, tenantScope) {
    const companyUser = await this.getCompanyUser(id, tenantScope);
    return this.repo.update('companyUser', companyUser.id, body);
  }

  async deleteCompanyUser(id, tenantScope) {
    const companyUser = await this.getCompanyUser(id, tenantScope);
    await this.repo.delete('companyUser', companyUser.id);
  }

  async listBillingProfiles(query, tenantScope) {
    const where = {};
    if (tenantScope.type === 'company') where.companyId = tenantScope.companyId;
    else if (query.companyId) where.companyId = query.companyId;
    return this.repo.findMany('companyBillingProfile', { where });
  }

  async getBillingProfile(id, tenantScope) {
    const profile = await this.repo.findUnique('companyBillingProfile', { where: { id } });
    if (!profile) throw AppError.notFound();
    this.assertCompanyScope(profile.companyId, tenantScope);
    return profile;
  }

  async createBillingProfile(body, tenantScope) {
    this.assertCompanyScope(body.companyId, tenantScope);
    return this.repo.create('companyBillingProfile', body);
  }

  async updateBillingProfile(id, body, tenantScope) {
    const profile = await this.getBillingProfile(id, tenantScope);
    return this.repo.update('companyBillingProfile', profile.id, body);
  }

  async listApprovalRules(query, tenantScope) {
    const where = {};
    if (tenantScope.type === 'company') where.companyId = tenantScope.companyId;
    else if (query.companyId) where.companyId = query.companyId;
    return this.repo.findMany('approvalRule', { where });
  }

  async createApprovalRule(body, tenantScope) {
    this.assertCompanyScope(body.companyId, tenantScope);
    return this.repo.create('approvalRule', body);
  }

  async updateApprovalRule(id, body, tenantScope) {
    const rule = await this.getScopedApprovalRule(id, tenantScope);
    return this.repo.update('approvalRule', rule.id, body);
  }

  async deleteApprovalRule(id, tenantScope) {
    const rule = await this.getScopedApprovalRule(id, tenantScope);
    await this.repo.delete('approvalRule', rule.id);
  }

  async listApprovals(tenantScope) {
    const where = { status: 'pending_approval', deletedAt: null };
    if (tenantScope.type === 'company') where.companyId = tenantScope.companyId;
    return this.repo.findMany('order', {
      where,
      include: { requester: true, serviceType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApproval(id, tenantScope) {
    const order = await this.repo.findFirst('order', {
      where: { id, status: 'pending_approval', deletedAt: null },
      include: {
        requester: true,
        serviceType: true,
        vehicleType: true,
        approvalHistory: true,
        locations: true,
        items: true,
        attachments: true,
      },
    });
    if (!order) throw AppError.notFound();
    this.assertCompanyScope(order.companyId, tenantScope);
    return order;
  }

  async approveOrder(id, body, user, tenantScope) {
    const order = await this.getApproval(id, tenantScope);
    return this.repo.approveOrder(order, user.id, body.notes);
  }

  async rejectOrder(id, body, user, tenantScope) {
    const order = await this.getApproval(id, tenantScope);
    return this.repo.rejectOrder(order, user.id, body.notes);
  }

  async getScopedApprovalRule(id, tenantScope) {
    const rule = await this.repo.findUnique('approvalRule', { where: { id } });
    if (!rule) throw AppError.notFound();
    this.assertCompanyScope(rule.companyId, tenantScope);
    return rule;
  }

  assertCompanyScope(companyId, tenantScope) {
    if (tenantScope.type === 'company' && companyId !== tenantScope.companyId) {
      throw AppError.forbidden();
    }
  }
}

module.exports = new CompaniesService();
