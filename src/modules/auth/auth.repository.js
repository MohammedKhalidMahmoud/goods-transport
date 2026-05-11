const { prisma } = require('../../lib/prisma');

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: this._userAuthInclude(),
    });
  }

  async findUserByPhone(phone) {
    return prisma.user.findUnique({
      where: { phone },
      include: this._userAuthInclude(),
    });
  }

  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: this._userAuthInclude(),
    });
  }

  async createRefreshToken(data) {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token) {
    return prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteAllUserRefreshTokens(userId) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async rotateRefreshToken(currentToken, nextTokenData) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.refreshToken.deleteMany({
        where: { token: currentToken },
      });

      if (deleted.count !== 1) {
        return null;
      }

      return tx.refreshToken.create({ data: nextTokenData });
    });
  }

  async getCompanyContext(userId) {
    return prisma.companyUser.findFirst({
      where: { userId },
      select: { companyId: true, branchId: true },
    });
  }

  async getProviderContext(userId) {
    return prisma.providerUser.findFirst({
      where: { userId },
      select: { providerId: true },
    });
  }

  /** Linked driver user → employer provider (for JWT tenant + provider-scoped reads in Phase 2). */
  async findDriverProviderId(userId) {
    const row = await prisma.providerDriver.findFirst({
      where: { userId, isActive: true },
      select: { providerId: true },
    });
    return row?.providerId ?? null;
  }

  async deleteUnusedPasswordResetTokens(userId) {
    return prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    });
  }

  async createPasswordResetToken(data) {
    return prisma.passwordResetToken.create({ data });
  }

  async findPasswordResetToken(token) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async markPasswordResetTokenUsed(id) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async updateUserPasswordHash(userId, passwordHash) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async deletePendingOtps(userId, type) {
    return prisma.otpVerification.deleteMany({
      where: { userId, type, verifiedAt: null },
    });
  }

  async createOtpVerification(data) {
    return prisma.otpVerification.create({ data });
  }

  async findLatestPendingOtp(userId, type) {
    return prisma.otpVerification.findFirst({
      where: { userId, type, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementOtpAttempts(id) {
    return prisma.otpVerification.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async markOtpVerified(id) {
    return prisma.otpVerification.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  _userAuthInclude() {
    return {
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
    };
  }
}

module.exports = { AuthRepository };
