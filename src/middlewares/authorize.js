const { AppError } = require('../utils/AppError');
const { buildTenantScopeFromUser, assertTenantClaimsMatchRoles } = require('../utils/tenantScope');
const { PERMISSIONS } = require('../constants/permissions');

const APP_ROLE_PERMISSIONS = {
  CUSTOMER: new Set([
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_READ_OWN,
    PERMISSIONS.ORDERS_UPDATE_OWN,
    PERMISSIONS.ORDERS_SUBMIT,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.OFFERS_READ_OWN,
    PERMISSIONS.OFFERS_ACCEPT,
    PERMISSIONS.OFFERS_REJECT,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_READ_OWN,
    PERMISSIONS.NOTIFICATIONS_READ_OWN,
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE_OWN,
    PERMISSIONS.MASTER_DATA_READ,
  ]),
  PROVIDER: new Set([
    PERMISSIONS.ORDERS_READ_PROVIDER,
    PERMISSIONS.OFFERS_READ_OWN,
    PERMISSIONS.OFFERS_CREATE,
    PERMISSIONS.OFFERS_WITHDRAW,
    PERMISSIONS.ASSIGNMENTS_READ_PROVIDER,
    PERMISSIONS.ASSIGNMENTS_READ_OWN,
    PERMISSIONS.ASSIGNMENTS_UPDATE_STATUS,
    PERMISSIONS.PROVIDERS_READ_OWN,
    PERMISSIONS.PROVIDERS_UPDATE_OWN,
    PERMISSIONS.NOTIFICATIONS_READ_OWN,
    PERMISSIONS.USERS_READ_OWN,
    PERMISSIONS.USERS_UPDATE_OWN,
    PERMISSIONS.MASTER_DATA_READ,
  ]),
};

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

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role].filter(Boolean);
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));
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

    if (req.user.myAdmin) {
      return next();
    }

    if (req.user.userType === 'APP') {
      const allowed = APP_ROLE_PERMISSIONS[req.user.role] || new Set();
      const hasAppPermission = requiredPermissions.some((permission) => allowed.has(permission));
      if (hasAppPermission) {
        return next();
      }
      throw AppError.forbidden('You do not have the required permission');
    }

    const permissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const hasPermission = permissions.some((perm) =>
      requiredPermissions.includes(perm)
    );
    if (!hasPermission) {
      throw AppError.forbidden('You do not have the required permission');
    }

    next();
  };
}

function requireAppRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden('You do not have the required role to access this resource');
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
  requireAppRole,
  resolveTenantScope,
  enforceTenantParam,
};
