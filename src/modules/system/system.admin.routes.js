const { authenticateDashboard } = require('../../middlewares/auth');
const { buildSystemRoutes } = require('./system.route-builder');

module.exports = buildSystemRoutes({ authenticate: authenticateDashboard, dashboardPrefix: '' });
