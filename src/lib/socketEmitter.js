const { logger } = require('./logger');

function getIo(app) {
  if (!app || !app.get) return null;
  return app.get('io') || null;
}

function emitToRoom(io, room, event, payload) {
  if (!io) return;
  try {
    io.to(room).emit(event, { event, payload, at: new Date().toISOString() });
  } catch (e) {
    logger.warn('Socket emit failed', { room, event, message: e.message });
  }
}

const EVENTS = {
  OFFER_NEW: 'offer:new',
  OFFER_UPDATED: 'offer:updated',
  OFFER_ACCEPTED: 'offer:accepted',
  OFFER_REJECTED: 'offer:rejected',
  ORDER_ASSIGNED: 'order:assigned',
  ORDER_STATUS: 'order:status',
  TRACKING_LOCATION: 'tracking:location',
  TICKET_UPDATED: 'ticket:updated',
  DASHBOARD_REFRESH: 'dashboard:refresh',
};

function emitOrder(io, orderId, event, payload) {
  emitToRoom(io, `order:${orderId}`, event, payload);
  emitToRoom(io, 'internal:ops', EVENTS.DASHBOARD_REFRESH, { scope: 'orders' });
}

function emitProvider(io, providerId, event, payload) {
  emitToRoom(io, `provider:${providerId}`, event, payload);
}

function emitUser(io, userId, event, payload) {
  emitToRoom(io, `user:${userId}`, event, payload);
}

module.exports = {
  getIo,
  emitToRoom,
  emitOrder,
  emitProvider,
  emitUser,
  EVENTS,
};
