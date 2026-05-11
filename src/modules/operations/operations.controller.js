const operationsService = require('./operations.service');
const { success, paginated } = require('../../utils/response');

class OperationsController {
  listOffers = async (req, res, next) => {
    try {
      const result = await operationsService.listOffers(req.query, req.user, req.tenantScope);
      return paginated(res, result.rows, { page: result.page, limit: result.limit, total: result.total }, 'Offers');
    } catch (err) {
      next(err);
    }
  };

  createOffer = async (req, res, next) => {
    try {
      const result = await operationsService.createOffer(req.body, req.user, req.tenantScope, req.app);
      return success(res, result, 'Created', 201);
    } catch (err) {
      next(err);
    }
  };

  getOffer = async (req, res, next) => {
    try {
      const result = await operationsService.getOffer(req.params.id, req.user, req.tenantScope);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  updateOffer = async (req, res, next) => {
    try {
      const result = await operationsService.updateOffer(req.params.id, req.body, req.tenantScope);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  withdrawOffer = async (req, res, next) => {
    try {
      await operationsService.withdrawOffer(req.params.id, req.user, req.tenantScope);
      return success(res, null, 'Withdrawn');
    } catch (err) {
      next(err);
    }
  };

  acceptOffer = async (req, res, next) => {
    try {
      const result = await operationsService.acceptOffer(req.params.id, req.user, req.tenantScope, req.app);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  rejectOffer = async (req, res, next) => {
    try {
      await operationsService.rejectOffer(req.params.id, req.user, req.tenantScope, req.app);
      return success(res, null, 'Rejected');
    } catch (err) {
      next(err);
    }
  };

  listAssignments = async (req, res, next) => {
    try {
      const result = await operationsService.listAssignments(req.query, req.user, req.tenantScope);
      return paginated(res, result.rows, { page: result.page, limit: result.limit, total: result.total }, 'Assignments');
    } catch (err) {
      next(err);
    }
  };

  createAssignment = async (req, res, next) => {
    try {
      const result = await operationsService.createAssignment(req.body, req.user, req.tenantScope, req);
      return success(res, result, 'Created', 201);
    } catch (err) {
      next(err);
    }
  };

  getAssignment = async (req, res, next) => {
    try {
      const result = await operationsService.getAssignment(req.params.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  updateAssignment = async (req, res, next) => {
    try {
      const result = await operationsService.updateAssignment(req.params.id, req.body);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  cancelAssignment = async (req, res, next) => {
    try {
      await operationsService.cancelAssignment(req.params.id);
      return success(res, null, 'Canceled');
    } catch (err) {
      next(err);
    }
  };

  listOrderItems = async (req, res, next) => {
    try {
      const result = await operationsService.listOrderItems(req.query.orderId, req.user, req.tenantScope);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  createOrderItem = async (req, res, next) => {
    try {
      const result = await operationsService.createOrderItem(req.body, req.user, req.tenantScope);
      return success(res, result, 'Created', 201);
    } catch (err) {
      next(err);
    }
  };

  updateOrderItem = async (req, res, next) => {
    try {
      const result = await operationsService.updateOrderItem(req.params.id, req.body, req.user, req.tenantScope);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  deleteOrderItem = async (req, res, next) => {
    try {
      await operationsService.deleteOrderItem(req.params.id, req.user, req.tenantScope);
      return success(res, null, 'Deleted');
    } catch (err) {
      next(err);
    }
  };

  getOrderItem = async (req, res, next) => {
    try {
      const result = await operationsService.getOrderItem(req.params.id, req.user, req.tenantScope);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  listTracking = async (req, res, next) => {
    try {
      const result = await operationsService.listTracking(req.params.orderId, req.query.assignmentId, req.user, req.tenantScope);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  listTrackingHistory = async (req, res, next) => {
    try {
      const result = await operationsService.listTrackingHistory(req.params.orderId, req.query.assignmentId, req.user, req.tenantScope);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  createTrackingEvent = async (req, res, next) => {
    try {
      const result = await operationsService.createTrackingEvent(req.params.orderId, req.body, req.user, req.tenantScope, req.app);
      return success(res, result, 'Recorded', 201);
    } catch (err) {
      next(err);
    }
  };

  createLocationEvent = async (req, res, next) => {
    try {
      const result = await operationsService.createLocationEvent(req.params.orderId, req.body, req.user, req.tenantScope, req.app);
      return success(res, result, 'Recorded', 201);
    } catch (err) {
      next(err);
    }
  };

  listDeliveryProofs = async (req, res, next) => {
    try {
      const result = await operationsService.listDeliveryProofs(req.params.orderId, req.user, req.tenantScope);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  createDeliveryProof = async (req, res, next) => {
    try {
      const result = await operationsService.createDeliveryProof(req.params.orderId, req.body, req.user, req.tenantScope);
      return success(res, result, 'Created', 201);
    } catch (err) {
      next(err);
    }
  };

  updateDeliveryProof = async (req, res, next) => {
    try {
      const result = await operationsService.updateDeliveryProof(req.params.id, req.body);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new OperationsController();
