const { Router } = require('express');
const { AuthController } = require('./auth.controller');
const { validate } = require('../../middlewares/validate');
const { authenticateDashboard } = require('../../middlewares/auth');
const { authLimiter } = require('../../middlewares/rateLimiter');
const {
  loginSchema,
  refreshSchema,
  logoutSchema,
} = require('./auth.validation');

const router = Router();
const controller = new AuthController();

router.post('/login', authLimiter, validate(loginSchema), controller.dashboardLogin);
router.post('/refresh', authLimiter, validate(refreshSchema), controller.dashboardRefresh);
router.post('/logout', authenticateDashboard, validate(logoutSchema), controller.logout);
router.get('/me', authenticateDashboard, controller.dashboardMe);

module.exports = router;
