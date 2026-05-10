const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { AppError } = require('../utils/AppError');
const { prisma } = require('../lib/prisma');

/**
 * Authenticate the request by verifying the JWT access token.
 * Attaches user, roles, permissions, and tenant context to req.
 */
async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
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
      },
    });

    if (!user || user.status !== 'active' || user.deletedAt) {
      throw AppError.unauthorized('User account is not active');
    }

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code)
        )
      ),
    ];

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles,
      permissions,
      companyId: decoded.companyId || null,
      providerId: decoded.providerId || null,
      branchId: decoded.branchId || null,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(err);
    }
    next(AppError.unauthorized('Authentication failed'));
  }
}

/**
 * Optional authentication — attaches user if token present, otherwise continues.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
}

module.exports = { authenticate, optionalAuth };
