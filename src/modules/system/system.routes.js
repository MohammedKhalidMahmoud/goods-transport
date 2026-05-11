const { authenticate } = require('../../middlewares/auth');
const { buildSystemRoutes } = require('./system.route-builder');

module.exports = buildSystemRoutes({ authenticate, dashboardPrefix: '/dashboard' });
