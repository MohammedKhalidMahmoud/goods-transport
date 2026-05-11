const { prisma } = require('../../lib/prisma');

const models = {
  service: prisma.service,
  city: prisma.city,
  pricingSetting: prisma.pricingSetting,
  appSetting: prisma.appSetting,
};

function model(name) {
  return models[name];
}

class MasterDataRepository {
  async paginate(modelName, listQuery, extraWhere = {}, queryOptions = {}) {
    const { page, limit, skip, take, orderBy, where } = listQuery;
    const finalWhere = { ...where, ...extraWhere };
    const delegate = model(modelName);
    const [total, rows] = await Promise.all([
      delegate.count({ where: finalWhere }),
      delegate.findMany({ where: finalWhere, orderBy, skip, take, ...queryOptions }),
    ]);
    return { rows, total, page, limit };
  }

  findUnique(modelName, id) {
    return model(modelName).findUnique({ where: { id } });
  }

  create(modelName, data) {
    return model(modelName).create({ data });
  }

  update(modelName, id, data) {
    return model(modelName).update({ where: { id }, data });
  }

  delete(modelName, id) {
    return model(modelName).delete({ where: { id } });
  }

}

module.exports = new MasterDataRepository();
