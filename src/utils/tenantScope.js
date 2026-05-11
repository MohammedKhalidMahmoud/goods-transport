const { INTERNAL_ROLES, PROVIDER_ROLES } = require('../constants/roles');

/**
 * Derives tenant scope from JWT-backed req.user fields and role membership.
 * Internal roles always get global scope regardless of stale JWT claims.
 */
function buildTenantScopeFromUser(user) {
  const { id: userId, providerId } = user;
  const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);

  if (user.userType === 'DASHBOARD') {
    return {
      type: 'global',
      id: null,
      providerId: null,
    };
  }

  if (roles.some((r) => INTERNAL_ROLES.includes(r))) {
    return {
      type: 'global',
      id: null,
      providerId: null,
    };
  }

  if (providerId) {
    return {
      type: 'provider',
      id: providerId,
      providerId,
    };
  }

  if (roles.includes('individual_customer') || roles.includes('CUSTOMER')) {
    return {
      type: 'self',
      id: userId,
      providerId: null,
    };
  }

  if (roles.includes('delivery_driver') || roles.includes('PROVIDER')) {
    return {
      type: 'assignment',
      id: userId,
      providerId: providerId || null,
    };
  }

  return {
    type: 'self',
    id: userId,
    providerId: null,
  };
}

function assertTenantClaimsMatchRoles(user) {
  const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
  const needsProvider = roles.some((r) => PROVIDER_ROLES.includes(r));

  if (needsProvider && !user.providerId) {
    return 'Provider context is missing; re-login or contact support.';
  }
  return null;
}

module.exports = { buildTenantScopeFromUser, assertTenantClaimsMatchRoles };
