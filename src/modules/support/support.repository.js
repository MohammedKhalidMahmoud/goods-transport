const { prisma } = require('../../lib/prisma');

class SupportRepository {
  findTicketForAccess(ticketId) {
    return prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { issueType: true },
    });
  }

  findOrderAccessContext(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, requesterId: true },
    });
  }
}

module.exports = new SupportRepository();
