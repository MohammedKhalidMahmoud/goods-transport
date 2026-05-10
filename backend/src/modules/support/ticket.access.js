const { prisma } = require('../../lib/prisma');
const { AppError } = require('../../utils/AppError');
const { PERMISSIONS } = require('../../constants/permissions');
async function loadTicketForAccess(ticketId) {
  const tkt = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { issueType: true },
  });
  if (!tkt) return null;

  // Ticket has `orderId` but no Prisma relation to Order in the current schema.
  // Load minimal order context separately when present (used for company-scope access checks).
  if (tkt.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: tkt.orderId },
      select: { id: true, companyId: true, requesterId: true },
    });
    return { ...tkt, order };
  }

  return { ...tkt, order: null };
}

/**
 * Ticket readable by: owner, internal (tickets:read), or company scope (tickets:read_company + same company).
 */
async function assertCanViewTicket(req, ticketId) {
  const tkt = await loadTicketForAccess(ticketId);
  if (!tkt) throw AppError.notFound('Ticket not found');

  if (tkt.userId === req.user.id) return tkt;

  const perms = req.user.permissions || [];
  if (perms.includes(PERMISSIONS.TICKETS_READ)) return tkt;

  if (perms.includes(PERMISSIONS.TICKETS_READ_COMPANY) && req.tenantScope?.type === 'company') {
    const companyId = req.tenantScope.companyId;
    const submitterInCompany = await prisma.companyUser.findFirst({
      where: { userId: tkt.userId, companyId },
    });
    const orderMatchesCompany = tkt.order?.companyId === companyId;
    if (submitterInCompany || orderMatchesCompany) return tkt;
  }

  throw AppError.forbidden('Cannot access this ticket');
}

module.exports = {
  loadTicketForAccess,
  assertCanViewTicket,
};
