const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { AppError } = require('../utils/AppError');
const { prisma } = require('../lib/prisma');

const USER_STATUS = {
  ACTIVE: 'ACTIVE',
};

const USER_TYPE = {
  APP: 'APP',
  DASHBOARD: 'DASHBOARD',
};

async function authenticateApp(req, _res, next) {
  return authenticateAudience(USER_TYPE.APP, req, next);
}

async function authenticateDashboard(req, _res, next) {
  return authenticateAudience(USER_TYPE.DASHBOARD, req, next);
}

async function authenticate(req, _res, next) {
  try {
    const decoded = verifyBearerToken(req);
    const audience = decoded.audience === USER_TYPE.APP ? USER_TYPE.APP : USER_TYPE.DASHBOARD;
    return authenticateAudience(audience, req, next);
  } catch (err) {
    if (err instanceof AppError) return next(err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(err);
    }
    next(AppError.unauthorized('Authentication failed'));
  }
}

async function authenticateAudience(audience, req, next) {
  try {
    const decoded = verifyBearerToken(req);
    if (decoded.audience !== audience) {
      throw AppError.unauthorized('Invalid access token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        dashboardProfile: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        providerProfile: true,
        providerUsers: {
          where: { isActive: true },
          select: { providerId: true },
          take: 1,
        },
      },
    });

    if (!user || user.status !== USER_STATUS.ACTIVE || user.deletedAt || user.userType !== audience) {
      throw AppError.unauthorized('User account is not active');
    }

    req.user = audience === USER_TYPE.DASHBOARD
      ? buildDashboardUser(user)
      : buildAppUser(user);

    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(err);
    }
    next(AppError.unauthorized('Authentication failed'));
  }
}

function verifyBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Access token is required');
  }

  return jwt.verify(authHeader.split(' ')[1], config.jwt.accessSecret);
}

function buildAppUser(user) {
  const providerId = user.providerUsers?.[0]?.providerId || null;

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    userType: user.userType,
    role: user.appRole,
    providerId,
    providerProfile: user.providerProfile || null,
  };
}

function buildDashboardUser(user) {
  const role = user.dashboardProfile?.role || null;
  const permissions = role
    ? [...new Set(role.rolePermissions.map((rp) => rp.permission.code))]
    : [];

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    userType: user.userType,
    roleId: user.dashboardProfile?.roleId || null,
    role: role?.code || null,
    myAdmin: Boolean(user.dashboardProfile?.myAdmin),
    permissions,
  };
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticateApp(req, res, next);
}

module.exports = {
  authenticate,
  authenticateApp,
  authenticateDashboard,
  optionalAuth,
};
