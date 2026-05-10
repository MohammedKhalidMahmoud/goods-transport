const { Router } = require('express');
const { AuthController } = require('./auth.controller');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { authLimiter } = require('../../middlewares/rateLimiter');
const {
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
} = require('./auth.validation');

const router = Router();
const controller = new AuthController();

router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/refresh', authLimiter, validate(refreshSchema), controller.refresh);
router.post('/logout', authenticate, validate(logoutSchema), controller.logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword);
router.post('/send-otp', authLimiter, validate(sendOtpSchema), controller.sendOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.get('/me', authenticate, controller.me);

module.exports = router;
