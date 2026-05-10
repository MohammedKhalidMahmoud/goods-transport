const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { logger } = require('../lib/logger');
const { ROLES, INTERNAL_ROLES } = require('../constants/roles');

const ROOM_PREFIXES = ['order:', 'provider:', 'company:', 'user:', 'internal:'];

function isAllowedRoom(room) {
  if (typeof room !== 'string' || !room.length) return false;
  return ROOM_PREFIXES.some((p) => room.startsWith(p));
}

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      socket.data.authenticated = false;
      return next();
    }
    try {
      const payload = jwt.verify(token, config.jwt.accessSecret);
      socket.data.authenticated = true;
      socket.data.userId = payload.userId;
      socket.data.roles = payload.roles || [];
      socket.data.companyId = payload.companyId || null;
      socket.data.providerId = payload.providerId || null;
      return next();
    } catch (e) {
      logger.warn('Socket JWT rejected', { message: e.message });
      return next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id, auth: !!socket.data.authenticated });

    if (socket.data.authenticated && socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }
    if (socket.data.authenticated && socket.data.companyId) {
      socket.join(`company:${socket.data.companyId}`);
    }
    if (socket.data.authenticated && socket.data.providerId) {
      socket.join(`provider:${socket.data.providerId}`);
    }
    if (socket.data.authenticated && socket.data.roles?.some((r) => INTERNAL_ROLES.includes(r))) {
      socket.join('internal:ops');
    }
    if (socket.data.authenticated && socket.data.roles?.includes(ROLES.SUPPORT_ADMIN)) {
      socket.join('internal:support');
    }

    socket.on('join_room', (room) => {
      if (!socket.data.authenticated) {
        return;
      }
      if (!isAllowedRoom(room)) {
        return;
      }
      if (room.startsWith('user:') && room !== `user:${socket.data.userId}`) {
        return;
      }
      if (room.startsWith('company:') && room !== `company:${socket.data.companyId}`) {
        return;
      }
      if (room.startsWith('provider:') && room !== `provider:${socket.data.providerId}`) {
        return;
      }
      if (room.startsWith('internal:') && !socket.data.roles?.some((r) => INTERNAL_ROLES.includes(r) || r === ROLES.SUPPORT_ADMIN)) {
        return;
      }
      socket.join(room);
      logger.debug('Socket joined room', { socketId: socket.id, room });
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      logger.debug('Socket left room', { socketId: socket.id, room });
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });

  return io;
}

module.exports = { initializeSocket };
