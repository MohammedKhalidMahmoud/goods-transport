const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { config } = require('../../config');
const { AppError } = require('../../utils/AppError');
const { AuthRepository } = require('./auth.repository');
const { logger } = require('../../lib/logger');

const USER_STATUS = {
  ACTIVE: 'ACTIVE',
};

const USER_TYPE = {
  APP: 'APP',
  DASHBOARD: 'DASHBOARD',
};

const APP_ROLE = {
  CUSTOMER: 'CUSTOMER',
  PROVIDER: 'PROVIDER',
};

class AuthService {
  constructor() {
    this.repo = new AuthRepository();
  }

  async login(identifier, password, sessionContext = {}) {
    const user = await this._validateCredentials(identifier, password, USER_TYPE.APP);
    if (!user.appRole || !Object.values(APP_ROLE).includes(user.appRole)) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const accessToken = this._generateAppAccessToken(user);
    const refreshToken = await this._issueRefreshToken(user, USER_TYPE.APP, sessionContext);

    return {
      accessToken,
      refreshToken,
      user: this._formatAppUser(user),
    };
  }

  async dashboardLogin(identifier, password, sessionContext = {}) {
    const user = await this._validateCredentials(identifier, password, USER_TYPE.DASHBOARD);
    if (!user.dashboardProfile?.roleId) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const accessToken = this._generateDashboardAccessToken(user);
    const refreshToken = await this._issueRefreshToken(user, USER_TYPE.DASHBOARD, sessionContext);

    return {
      accessToken,
      refreshToken,
      user: this._formatDashboardUser(user),
    };
  }

  async refresh(refreshTokenValue, sessionContext = {}) {
    return this._refreshForAudience(refreshTokenValue, USER_TYPE.APP, sessionContext);
  }

  async dashboardRefresh(refreshTokenValue, sessionContext = {}) {
    return this._refreshForAudience(refreshTokenValue, USER_TYPE.DASHBOARD, sessionContext);
  }

  async logout(refreshTokenValue) {
    if (!refreshTokenValue) {
      return;
    }

    try {
      await this.repo.deleteRefreshToken(this._hashRefreshToken(refreshTokenValue));
      if (this._isLegacyRefreshToken(refreshTokenValue)) {
        await this.repo.deleteRefreshToken(refreshTokenValue);
      }
    } catch {
      // Token may already be deleted — ignore
    }
  }

  async forgotPassword(email) {
    const normalized = String(email || '').trim().toLowerCase();
    const user = await this.repo.findUserByEmail(normalized);
    if (!user || user.deletedAt || user.status !== USER_STATUS.ACTIVE) {
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
    if (row.user.status !== USER_STATUS.ACTIVE || row.user.deletedAt) {
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
    const user = type === 'email'
      ? await this.repo.findUserByEmail(String(identifier || '').trim().toLowerCase())
      : await this.repo.findUserByPhone(String(identifier || '').trim());
    if (!user || user.deletedAt || user.status !== USER_STATUS.ACTIVE) {
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
    const user = type === 'email'
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
    if (!user || user.userType !== USER_TYPE.APP) {
      throw AppError.notFound('User not found');
    }

    return this._formatAppUser(user);
  }

  async getCurrentDashboardUser(userId) {
    const user = await this.repo.findUserById(userId);
    if (!user || user.userType !== USER_TYPE.DASHBOARD) {
      throw AppError.notFound('User not found');
    }

    return this._formatDashboardUser(user);
  }

  async _validateCredentials(identifier, password, userType) {
    const normalizedIdentifier = String(identifier || '').trim();
    const isEmail = normalizedIdentifier.includes('@');
    const user = isEmail
      ? await this.repo.findUserByEmail(normalizedIdentifier.toLowerCase())
      : await this.repo.findUserByPhone(normalizedIdentifier);

    if (!user || user.userType !== userType || user.deletedAt) {
      throw AppError.unauthorized('Invalid credentials');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new AppError('Account is not active', 401, 'ACCOUNT_DISABLED');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid credentials');
    }

    return user;
  }

  async _refreshForAudience(refreshTokenValue, audience, sessionContext = {}) {
    const {
      stored,
      storageValue: currentTokenStorageValue,
      payload,
    } = await this._findStoredRefreshToken(refreshTokenValue, audience);

    if (!stored) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      await this.repo.deleteRefreshToken(currentTokenStorageValue);
      throw AppError.unauthorized('Refresh token expired');
    }

    if (stored.user.status !== USER_STATUS.ACTIVE || stored.user.deletedAt || stored.user.userType !== audience) {
      await this.repo.deleteRefreshToken(currentTokenStorageValue);
      throw AppError.unauthorized('User account is not active');
    }

    if (payload && payload.userId !== stored.userId) {
      await this.repo.deleteRefreshToken(currentTokenStorageValue);
      throw AppError.unauthorized('Invalid refresh token');
    }

    const user = await this.repo.findUserById(stored.userId);
    const accessToken = audience === USER_TYPE.DASHBOARD
      ? this._generateDashboardAccessToken(user)
      : this._generateAppAccessToken(user);
    const nextRefreshToken = this._createRefreshTokenPayload(user, audience);
    const rotatedToken = await this.repo.rotateRefreshToken(currentTokenStorageValue, {
      token: nextRefreshToken.hash,
      userId: user.id,
      expiresAt: nextRefreshToken.expiresAt,
      userAgent: sessionContext.userAgent || null,
      ipAddress: sessionContext.ipAddress || null,
    });

    if (!rotatedToken) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    return { accessToken, refreshToken: nextRefreshToken.value };
  }

  _generateAppAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        role: user.appRole,
        audience: USER_TYPE.APP,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );
  }

  _generateDashboardAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        roleId: user.dashboardProfile.roleId,
        myAdmin: user.dashboardProfile.myAdmin,
        audience: USER_TYPE.DASHBOARD,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );
  }

  async _issueRefreshToken(user, audience, sessionContext = {}) {
    const refreshToken = this._createRefreshTokenPayload(user, audience);

    await this.repo.createRefreshToken({
      token: refreshToken.hash,
      userId: user.id,
      expiresAt: refreshToken.expiresAt,
      userAgent: sessionContext.userAgent || null,
      ipAddress: sessionContext.ipAddress || null,
    });

    return refreshToken.value;
  }

  _createRefreshTokenPayload(user, audience) {
    const value = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
        audience,
        jti: uuidv4(),
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );
    const decoded = jwt.decode(value);

    return {
      value,
      hash: this._hashRefreshToken(value),
      expiresAt: new Date(decoded.exp * 1000),
    };
  }

  async _findStoredRefreshToken(token, audience) {
    const tokenHash = this._hashRefreshToken(token);

    try {
      const payload = this._verifyRefreshToken(token, audience);
      return {
        stored: await this.repo.findRefreshToken(tokenHash),
        storageValue: tokenHash,
        payload,
      };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        await this.repo.deleteRefreshToken(tokenHash);
        throw AppError.unauthorized('Refresh token expired');
      }

      if (err instanceof AppError || !this._isLegacyRefreshToken(token)) {
        throw AppError.unauthorized('Invalid refresh token');
      }
    }

    let storageValue = tokenHash;
    let stored = await this.repo.findRefreshToken(storageValue);

    if (!stored && this._isLegacyUuidRefreshToken(token)) {
      storageValue = token;
      stored = await this.repo.findRefreshToken(storageValue);
    }

    return { stored, storageValue, payload: null };
  }

  _verifyRefreshToken(token, audience) {
    const payload = jwt.verify(token, config.jwt.refreshSecret);
    if (payload.type !== 'refresh' || payload.audience !== audience || !payload.userId) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    return payload;
  }

  _formatAppUser(user) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      role: user.appRole,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        language: user.language,
      },
    };
  }

  _formatDashboardUser(user) {
    const dashboardProfile = user.dashboardProfile;
    const role = dashboardProfile?.role || null;
    const result = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roleId: dashboardProfile?.roleId || null,
      role: role
        ? {
            id: role.id,
            code: role.code,
            name: role.name,
          }
        : null,
      myAdmin: Boolean(dashboardProfile?.myAdmin),
      jobTitle: dashboardProfile?.jobTitle || null,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        language: user.language,
      },
    };

    if (!result.myAdmin && role) {
      result.permissions = [
        ...new Set(role.rolePermissions.map((rp) => rp.permission.code)),
      ];
    }

    return result;
  }

  _hashRefreshToken(token) {
    return crypto
      .createHmac('sha256', config.jwt.refreshSecret)
      .update(String(token || ''))
      .digest('hex');
  }

  _isLegacyRefreshToken(token) {
    return this._isLegacyUuidRefreshToken(token) || /^[0-9a-f]{128}$/i.test(String(token || ''));
  }

  _isLegacyUuidRefreshToken(token) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(token || '')
    );
  }
}

module.exports = { AuthService, USER_TYPE, APP_ROLE, USER_STATUS };
