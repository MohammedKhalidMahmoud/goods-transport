const { INTERNAL_ROLES, COMPANY_ROLES, PROVIDER_ROLES } = require('../constants/roles');

/**
 * Derives tenant scope from JWT-backed req.user fields and role membership.
 * Internal roles always get global scope regardless of stale JWT claims.
 */
function buildTenantScopeFromUser(user) {
  const { id: userId, roles, companyId, providerId, branchId } = user;

  if (roles.some((r) => INTERNAL_ROLES.includes(r))) {
    return {
      type: 'global',
      id: null,
      branchId: null,
      companyId: null,
      providerId: null,
    };
  }

  if (companyId) {
    return {
      type: 'company',
      id: companyId,
      branchId: branchId || null,
      companyId,
      providerId: providerId || null,
    };
  }

  if (providerId) {
    return {
      type: 'provider',
      id: providerId,
      branchId: null,
      companyId: null,
      providerId,
    };
  }

  if (roles.includes('individual_customer')) {
    return {
      type: 'self',
      id: userId,
      branchId: null,
      companyId: null,
      providerId: null,
    };
  }

  if (roles.includes('delivery_driver')) {
    return {
      type: 'assignment',
      id: userId,
      branchId: null,
      companyId: null,
      providerId: providerId || null,
    };
  }

  return {
    type: 'self',
    id: userId,
    branchId: null,
    companyId: null,
    providerId: null,
  };
}

function assertTenantClaimsMatchRoles(user) {
  const needsCompany = user.roles.some((r) => COMPANY_ROLES.includes(r));
  const needsProvider = user.roles.some((r) => PROVIDER_ROLES.includes(r));

  if (needsCompany && !user.companyId) {
    return 'Company context is missing; re-login or contact support.';
  }
  if (needsProvider && !user.providerId) {
    return 'Provider context is missing; re-login or contact support.';
  }
  return null;
}

module.exports = { buildTenantScopeFromUser, assertTenantClaimsMatchRoles };
