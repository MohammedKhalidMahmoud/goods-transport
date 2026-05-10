/**
 * Repository-layer helpers: merge tenant filters into Prisma `where` objects.
 * Controllers should not build tenant filters directly — use services + these helpers.
 */

function mergeWhere(baseWhere, fragment) {
  if (!fragment || Object.keys(fragment).length === 0) return baseWhere;
  if (!baseWhere || Object.keys(baseWhere).length === 0) return fragment;
  return { AND: [baseWhere, fragment] };
}

function companyTenantWhere(tenantScope) {
  if (tenantScope.type === 'global') return {};
  if (tenantScope.type === 'company' && tenantScope.companyId) {
    return { companyId: tenantScope.companyId };
  }
  return null;
}

function providerTenantWhere(tenantScope) {
  if (tenantScope.type === 'global') return {};
  if (tenantScope.type === 'provider' && tenantScope.providerId) {
    return { providerId: tenantScope.providerId };
  }
  return null;
}

function requesterSelfWhere(tenantScope) {
  if (tenantScope.type === 'self' && tenantScope.id) {
    return { requesterId: tenantScope.id };
  }
  return null;
}

module.exports = {
  mergeWhere,
  companyTenantWhere,
  providerTenantWhere,
  requesterSelfWhere,
};
