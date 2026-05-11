const { INTERNAL_ROLES } = require('../../constants/roles');
const ordersRepository = require('./orders.repository');

async function loadOrderForAccess(orderId) {
  return ordersRepository.loadOrderForAccess(orderId);
}

function canViewOrder(user, tenantScope, order) {
  if (!order) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
  if (roles.some((r) => INTERNAL_ROLES.includes(r))) return true;
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
  const driverRows = await ordersRepository.findActiveDriverIdsByUser(userId);
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
