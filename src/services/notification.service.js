const { prisma } = require('../lib/prisma');

async function notifyUser(userId, title, body, type = 'info', data = null) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      body,
      type,
      data: data || undefined,
    },
  });
}

async function notifyUsers(userIds, title, body, type = 'info', data = null) {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      title,
      body,
      type,
      data: data || undefined,
    })),
  });
}

module.exports = { notifyUser, notifyUsers };
