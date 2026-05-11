async function writeAudit(req, action, entityType, entityId, oldData = null, newData = null) {
  return { req, action, entityType, entityId, oldData, newData };
}

module.exports = { writeAudit };
