const { prisma } = require('../../lib/prisma');
const masterDataRepository = require('../master-data/master-data.repository');

async function findByGroup(group) {
  return prisma.appSetting.findMany({
    where: { group },
    orderBy: { key: 'asc' },
  });
}

module.exports = {
  ...masterDataRepository,
  findByGroup,
};
