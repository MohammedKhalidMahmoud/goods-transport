const systemController = require('../system/system.controller');

module.exports = {
  listInvoices: systemController.listInvoices,
  createInvoice: systemController.createInvoice,
  getInvoice: systemController.getInvoice,
  updateInvoice: systemController.updateInvoice,
  deleteInvoice: systemController.deleteInvoice,
  issueInvoice: systemController.issueInvoice,
  markInvoicePaid: systemController.markInvoicePaid,
};
