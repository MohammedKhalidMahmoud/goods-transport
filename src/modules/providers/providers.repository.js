const { prisma } = require('../../lib/prisma');

class ProvidersRepository {
  async count(model, where) {
    return prisma[model].count({ where });
  }

  async findMany(model, args) {
    return prisma[model].findMany(args);
  }

  async findUnique(model, args) {
    return prisma[model].findUnique(args);
  }

  async findFirst(model, args) {
    return prisma[model].findFirst(args);
  }

  async create(model, data) {
    return prisma[model].create({ data });
  }

  async update(model, id, data) {
    return prisma[model].update({ where: { id }, data });
  }

  async delete(model, id) {
    return prisma[model].delete({ where: { id } });
  }

  async createProvider(data) {
    return prisma.$transaction(async (tx) => {
      const provider = await tx.provider.create({ data });
      await tx.providerWallet.create({ data: { providerId: provider.id } });
      return provider;
    });
  }

  async getProviderEarnings(providerId) {
    const [commAgg, wallet] = await Promise.all([
      prisma.commission.aggregate({
        where: { providerId },
        _sum: { amount: true },
      }),
      prisma.providerWallet.findUnique({ where: { providerId } }),
    ]);

    return {
      wallet,
      commissionsTotal: commAgg._sum.amount || 0,
    };
  }
}

module.exports = { ProvidersRepository };
