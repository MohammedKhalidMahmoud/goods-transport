const systemController = require('../system/system.controller');

module.exports = {
  listTickets: systemController.listTickets,
  createTicket: systemController.createTicket,
  getTicket: systemController.getTicket,
  updateTicket: systemController.updateTicket,
  deleteTicket: systemController.deleteTicket,
  listTicketComments: systemController.listTicketComments,
  createTicketComment: systemController.createTicketComment,
  assignTicket: systemController.assignTicket,
  resolveTicket: systemController.resolveTicket,
  closeTicket: systemController.closeTicket,
  listIssueTypes: systemController.listIssueTypes,
};
