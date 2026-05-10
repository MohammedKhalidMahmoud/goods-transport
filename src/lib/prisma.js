const { PrismaClient } = require('@prisma/client');
const { config } = require('../config');

const prisma = new PrismaClient({
  log: config.env === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

module.exports = { prisma };
