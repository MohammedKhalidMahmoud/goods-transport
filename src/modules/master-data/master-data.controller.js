const { success, paginated } = require('../../utils/response');
const service = require('./master-data.service');

const list = (resource, label = 'OK') => async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await service.listResource(resource, req.query, req.tenantScope);
    return paginated(res, rows, { page, limit, total }, label);
  } catch (error) {
    return next(error);
  }
};

const get = (resource) => async (req, res, next) => {
  try {
    return success(res, await service.getResource(resource, req.params.id));
  } catch (error) {
    return next(error);
  }
};

const create = (resource) => async (req, res, next) => {
  try {
    return success(res, await service.createResource(resource, req.body, req.tenantScope), 'Created', 201);
  } catch (error) {
    return next(error);
  }
};

const update = (resource) => async (req, res, next) => {
  try {
    return success(res, await service.updateResource(resource, req.params.id, req.body, req.tenantScope), 'Updated');
  } catch (error) {
    return next(error);
  }
};

const remove = (resource) => async (req, res, next) => {
  try {
    await service.deleteResource(resource, req.params.id, req.tenantScope);
    return success(res, null, 'Deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  list,
  get,
  create,
  update,
  remove,
};
