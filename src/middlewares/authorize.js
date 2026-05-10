const { AppError } = require('../utils/AppError');
const { buildTenantScopeFromUser, assertTenantClaimsMatchRoles } = require('../utils/tenantScope');

/**
 * Middleware to check if the authenticated user has at least one of the required roles.
 *
 * Usage:
 *   router.get('/users', authenticate, authorizeRoles('super_admin', 'operations_admin'), controller.list);
 */
function authorizeRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      throw AppError.forbidden('You do not have the required role to access this resource');
    }

    next();
  };
}

/**
 * Middleware to check if the authenticated user has at least one of the required permissions.
 *
 * Usage:
 *   router.get('/orders', authenticate, authorizePermissions('orders:read', 'orders:read_own'), controller.list);
 */
function authorizePermissions(...requiredPermissions) {
  return (req, _res, next) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const hasPermission = req.user.permissions.some((perm) =>
      requiredPermissions.includes(perm)
    );
    if (!hasPermission) {
      throw AppError.forbidden('You do not have the required permission');
    }

    next();
  };
}

/**
 * Middleware to resolve and enforce tenant scoping.
 * Ensures company/provider-scoped users can only access their own tenant data.
 *
 * Attaches req.tenantScope with { type, id } for use in repositories.
 */
function resolveTenantScope(req, _res, next) {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const mismatch = assertTenantClaimsMatchRoles(req.user);
  if (mismatch) {
    throw AppError.forbidden(mismatch);
  }

  req.tenantScope = buildTenantScopeFromUser(req.user);
  next();
}

/**
 * Verify that the requested resource belongs to the user's tenant.
 * Used when a route parameter specifies a companyId or providerId.
 */
function enforceTenantParam(paramName) {
  return (req, _res, next) => {
    if (!req.tenantScope) {
      throw AppError.internal('Tenant scope not resolved');
    }

    if (req.tenantScope.type === 'global') {
      return next();
    }

    const paramValue = req.params[paramName];
    if (paramValue && paramValue !== req.tenantScope.id) {
      throw AppError.forbidden('Access denied: tenant mismatch');
    }

    next();
  };
}

module.exports = {
  authorizeRoles,
  authorizePermissions,
  resolveTenantScope,
  enforceTenantParam,
};
