const { prisma } = require('../../lib/prisma');

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
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
        profile: true,
      },
    });
  }

  async findUserByPhone(phone) {
    return prisma.user.findUnique({
      where: { phone },
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
        profile: true,
      },
    });
  }

  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
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
        profile: true,
      },
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
    return prisma.refreshToken.delete({
      where: { token },
    });
  }

  async deleteAllUserRefreshTokens(userId) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
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
}

module.exports = { AuthRepository };
