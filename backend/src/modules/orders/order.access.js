const { prisma } = require('../../lib/prisma');
const { INTERNAL_ROLES } = require('../../constants/roles');

async function loadOrderForAccess(orderId) {
  return prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      serviceType: true,
      vehicleType: true,
      requester: { include: { profile: true } },
      locations: true,
      items: true,
      attachments: true,
      offers: true,
      assignments: {
        include: { driver: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

function canViewOrder(user, tenantScope, order) {
  if (!order) return false;
  if (user.roles.some((r) => INTERNAL_ROLES.includes(r))) return true;
  if (tenantScope.type === 'company' && order.companyId === tenantScope.companyId) return true;
  if (tenantScope.type === 'self' && order.requesterId === user.id) return true;
  if (tenantScope.type === 'provider' && tenantScope.providerId) {
    return (
      order.offers?.some((o) => o.providerId === tenantScope.providerId) ||
      order.assignments?.some((a) => a.providerId === tenantScope.providerId)
    );
  }
  if (tenantScope.type === 'assignment') {
    return order.assignments?.some(
      (a) => a.driver && a.driver.userId === user.id
    );
  }
  return false;
}

/** Driver check: assignment links driver record with userId */
async function canDriverViewOrder(userId, order) {
  const driverRows = await prisma.providerDriver.findMany({
    where: { userId, isActive: true },
    select: { id: true },
  });
  const ids = driverRows.map((d) => d.id);
  if (ids.length === 0) return false;
  return order.assignments?.some((a) => a.driverId && ids.includes(a.driverId));
}

async function assertCanViewOrder(user, tenantScope, orderId) {
  const { AppError } = require('../../utils/AppError');
  const order = await loadOrderForAccess(orderId);
  if (!order) throw AppError.notFound('Order not found');
  let ok = canViewOrder(user, tenantScope, order);
  if (!ok && tenantScope.type === 'assignment') {
    ok = await canDriverViewOrder(user.id, order);
  }
  if (!ok) throw AppError.forbidden('Cannot access this order');
  return order;
}

module.exports = {
  loadOrderForAccess,
  canViewOrder,
  assertCanViewOrder,
};
