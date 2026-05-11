const { prisma } = require('../../lib/prisma');

class CompaniesRepository {
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

  async approveOrder(order, userId, notes) {
    await prisma.$transaction(async (tx) => {
      await tx.approvalHistory.create({
        data: {
          orderId: order.id,
          approverId: userId,
          status: 'approved',
          notes,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'published_for_offers', updatedBy: userId },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: 'pending_approval',
          toStatus: 'published_for_offers',
          changedBy: userId,
          notes: 'Approved',
        },
      });
    });

    return prisma.order.findUnique({ where: { id: order.id } });
  }

  async rejectOrder(order, userId, notes) {
    await prisma.$transaction(async (tx) => {
      await tx.approvalHistory.create({
        data: {
          orderId: order.id,
          approverId: userId,
          status: 'rejected',
          notes,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'rejected', updatedBy: userId },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: 'pending_approval',
          toStatus: 'rejected',
          changedBy: userId,
          notes,
        },
      });
    });

    return prisma.order.findUnique({ where: { id: order.id } });
  }
}

module.exports = { CompaniesRepository };
