const { prisma } = require('../lib/prisma');

async function writeAudit(req, action, entityType, entityId, oldData = null, newData = null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action,
        entityType,
        entityId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      },
    });
  } catch {
    // never block main flow
  }
}

module.exports = { writeAudit };
