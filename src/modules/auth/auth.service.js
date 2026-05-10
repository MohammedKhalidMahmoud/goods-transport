const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { config } = require('../../config');
const { AppError } = require('../../utils/AppError');
const { ROLE_SCOPE, COMPANY_ROLES, PROVIDER_ROLES, ROLES } = require('../../constants/roles');
const { AuthRepository } = require('./auth.repository');
const { logger } = require('../../lib/logger');

class AuthService {
  constructor() {
    this.repo = new AuthRepository();
  }

  async login(identifier, password) {
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await this.repo.findUserByEmail(identifier)
      : await this.repo.findUserByPhone(identifier);

    if (!user) {
      throw AppError.unauthorized('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new AppError('Account is not active', 401, 'ACCOUNT_DISABLED');
    }

    if (user.deletedAt) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code)
        )
      ),
    ];

    const tenantContext = await this._resolveTenantContext(user.id, roles);

    const accessToken = this._generateAccessToken(user, roles, tenantContext);
    const refreshToken = await this._generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        profile: user.profile
          ? {
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              avatarUrl: user.profile.avatarUrl,
            }
          : null,
        roles,
        permissions,
        tenantContext,
      },
    };
  }

  async refresh(refreshTokenValue) {
    const stored = await this.repo.findRefreshToken(refreshTokenValue);

    if (!stored) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      await this.repo.deleteRefreshToken(refreshTokenValue);
      throw AppError.unauthorized('Refresh token expired');
    }

    if (stored.user.status !== 'active' || stored.user.deletedAt) {
      throw AppError.unauthorized('User account is not active');
    }

    await this.repo.deleteRefreshToken(refreshTokenValue);

    const user = await this.repo.findUserById(stored.userId);
    const roles = user.userRoles.map((ur) => ur.role.code);
    const tenantContext = await this._resolveTenantContext(user.id, roles);

    const accessToken = this._generateAccessToken(user, roles, tenantContext);
    const newRefreshToken = await this._generateRefreshToken(user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshTokenValue) {
    try {
      await this.repo.deleteRefreshToken(refreshTokenValue);
    } catch {
      // Token may already be deleted — ignore
    }
  }

  /**
   * Always returns the same shape (no user enumeration).
   * In non-production, logs a single-line hint for developers (no email in log).
   */
  async forgotPassword(email) {
    const normalized = String(email || '').trim().toLowerCase();
    const user = await this.repo.findUserByEmail(normalized);
    if (!user || user.deletedAt || user.status !== 'active') {
      return { delivered: true };
    }
    await this.repo.deleteUnusedPasswordResetTokens(user.id);
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.repo.createPasswordResetToken({ token, userId: user.id, expiresAt });
    if (config.env !== 'production') {
      logger.info('Password reset token issued (dev only — integrate email in production)');
    }
    return { delivered: true };
  }

  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw AppError.badRequest('Token and new password are required');
    }
    const row = await this.repo.findPasswordResetToken(token);
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired reset token');
    }
    if (row.user.status !== 'active' || row.user.deletedAt) {
      throw AppError.badRequest('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.repo.updateUserPasswordHash(row.userId, passwordHash);
    await this.repo.markPasswordResetTokenUsed(row.id);
    await this.repo.deleteAllUserRefreshTokens(row.userId);
    return { reset: true };
  }

  async sendOtp(identifier, type) {
    if (!['email', 'phone'].includes(type)) {
      throw AppError.badRequest('type must be email or phone');
    }
    const isEmail = type === 'email';
    const user = isEmail
      ? await this.repo.findUserByEmail(String(identifier || '').trim().toLowerCase())
      : await this.repo.findUserByPhone(String(identifier || '').trim());
    if (!user || user.deletedAt || user.status !== 'active') {
      return { sent: true };
    }
    await this.repo.deletePendingOtps(user.id, type);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.repo.createOtpVerification({
      userId: user.id,
      code,
      type,
      expiresAt,
    });
    if (config.env !== 'production') {
      logger.info('OTP issued (dev only — integrate SMS/email in production)', { type });
    }
    return { sent: true };
  }

  async verifyOtp(identifier, code, type) {
    if (!['email', 'phone'].includes(type)) {
      throw AppError.badRequest('type must be email or phone');
    }
    const isEmail = type === 'email';
    const user = isEmail
      ? await this.repo.findUserByEmail(String(identifier || '').trim().toLowerCase())
      : await this.repo.findUserByPhone(String(identifier || '').trim());
    if (!user) {
      throw AppError.unauthorized('Invalid code');
    }
    const otp = await this.repo.findLatestPendingOtp(user.id, type);
    if (!otp || otp.expiresAt < new Date()) {
      throw AppError.unauthorized('Invalid or expired code');
    }
    if (otp.attempts >= 5) {
      throw AppError.unauthorized('Too many attempts');
    }
    if (otp.code !== String(code).trim()) {
      await this.repo.incrementOtpAttempts(otp.id);
      throw AppError.unauthorized('Invalid code');
    }
    await this.repo.markOtpVerified(otp.id);
    return { verified: true };
  }

  async getCurrentUser(userId) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code)
        )
      ),
    ];
    const tenantContext = await this._resolveTenantContext(user.id, roles);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            avatarUrl: user.profile.avatarUrl,
            language: user.profile.language,
          }
        : null,
      roles,
      permissions,
      tenantContext,
    };
  }

  async _resolveTenantContext(userId, roles) {
    const context = { type: 'global', companyId: null, providerId: null, branchId: null };

    const hasCompanyRole = roles.some((r) => COMPANY_ROLES.includes(r));
    const hasProviderRole = roles.some((r) => PROVIDER_ROLES.includes(r));

    if (hasCompanyRole) {
      const companyCtx = await this.repo.getCompanyContext(userId);
      if (companyCtx) {
        context.type = 'company';
        context.companyId = companyCtx.companyId;
        context.branchId = companyCtx.branchId;
      }
    } else if (hasProviderRole) {
      const providerCtx = await this.repo.getProviderContext(userId);
      if (providerCtx) {
        context.type = 'provider';
        context.providerId = providerCtx.providerId;
      }
    } else if (roles.includes(ROLES.INDIVIDUAL_CUSTOMER)) {
      context.type = ROLE_SCOPE[ROLES.INDIVIDUAL_CUSTOMER] || 'self';
    } else if (roles.includes(ROLES.DELIVERY_DRIVER)) {
      context.type = ROLE_SCOPE[ROLES.DELIVERY_DRIVER] || 'assignment';
      const driverProviderId = await this.repo.findDriverProviderId(userId);
      if (driverProviderId) {
        context.providerId = driverProviderId;
      }
    }

    return context;
  }

  _generateAccessToken(user, roles, tenantContext) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles,
        companyId: tenantContext.companyId,
        providerId: tenantContext.providerId,
        branchId: tenantContext.branchId,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );
  }

  async _generateRefreshToken(userId) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.repo.createRefreshToken({
      token,
      userId,
      expiresAt,
    });

    return token;
  }
}

module.exports = { AuthService };
