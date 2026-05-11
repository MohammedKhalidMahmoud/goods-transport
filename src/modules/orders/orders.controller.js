const { success, paginated } = require('../../utils/response');
const orderService = require('./order.service');

const listOrders = async (req, res, next) => {
  try {
    const { rows, total, page, limit } = await orderService.listOrders(req.query, req.user, req.tenantScope);
    return paginated(res, rows, { page, limit, total }, 'Orders');
  } catch (error) {
    return next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user, req.tenantScope, req);
    return success(res, order, 'Created', 201);
  } catch (error) {
    return next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await orderService.assertCanViewOrder(req.user, req.tenantScope, req.params.id);
    return success(res, order);
  } catch (error) {
    return next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const order = await orderService.updateOrder(req.params.id, req.body, req.user, req.tenantScope, req);
    return success(res, order, 'Updated');
  } catch (error) {
    return next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    await orderService.softDeleteOrder(req.params.id, req.user, req.tenantScope, req);
    return success(res, null, 'Deleted');
  } catch (error) {
    return next(error);
  }
};

const getTimeline = async (req, res, next) => {
  try {
    const rows = await orderService.getOrderTimeline(req.params.id, req.user, req.tenantScope);
    return success(res, rows);
  } catch (error) {
    return next(error);
  }
};

const listAttachments = async (req, res, next) => {
  try {
    const rows = await orderService.listOrderAttachments(req.params.id, req.user, req.tenantScope);
    return success(res, rows);
  } catch (error) {
    return next(error);
  }
};

const createAttachment = async (req, res, next) => {
  try {
    const attachment = await orderService.createOrderAttachment(req.params.id, req.body, req.user, req.tenantScope);
    return success(res, attachment, 'Uploaded', 201);
  } catch (error) {
    return next(error);
  }
};

const submitOrder = async (req, res, next) => {
  try {
    const order = await orderService.submitOrder(req.params.id, req.user, req.tenantScope, req);
    return success(res, order, 'Submitted');
  } catch (error) {
    return next(error);
  }
};

const publishOrder = async (req, res, next) => {
  try {
    const order = await orderService.publishOrder(req.params.id, req.user, req.tenantScope, req);
    return success(res, order, 'Published');
  } catch (error) {
    return next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.body, req.user, req.tenantScope, req);
    return success(res, order, 'Canceled');
  } catch (error) {
    return next(error);
  }
};

const assignOrder = async (req, res, next) => {
  try {
    const assignment = await orderService.assignOrder(req.params.id, req.body, req.user, req.tenantScope, req);
    return success(res, assignment, 'Assigned', 201);
  } catch (error) {
    return next(error);
  }
};

const transitionOrder = (status) => async (req, res, next) => {
  try {
    const order = await orderService.transitionSimple(req.params.id, status, req.user, req.tenantScope, req);
    return success(res, order);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listOrders,
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
  getTimeline,
  listAttachments,
  createAttachment,
  submitOrder,
  publishOrder,
  cancelOrder,
  assignOrder,
  transitionOrder,
};
