const { AuthService } = require('./auth.service');
const { success } = require('../../utils/response');

class AuthController {
  constructor() {
    this.service = new AuthService();
  }

  login = async (req, res, next) => {
    try {
      const { identifier, password } = req.body;
      const result = await this.service.login(identifier, password, this._sessionContext(req));
      return success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  };

  dashboardLogin = async (req, res, next) => {
    try {
      const { identifier, password } = req.body;
      const result = await this.service.dashboardLogin(identifier, password, this._sessionContext(req));
      return success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.service.refresh(refreshToken, this._sessionContext(req));
      return success(res, result, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  };

  dashboardRefresh = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.service.dashboardRefresh(refreshToken, this._sessionContext(req));
      return success(res, result, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  };

  logout = async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      await this.service.logout(refreshToken);
      return success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  };

  me = async (req, res, next) => {
    try {
      const user = await this.service.getCurrentUser(req.user.id);
      return success(res, user, 'Current user retrieved');
    } catch (err) {
      next(err);
    }
  };

  dashboardMe = async (req, res, next) => {
    try {
      const user = await this.service.getCurrentDashboardUser(req.user.id);
      return success(res, user, 'Current user retrieved');
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req, res, next) => {
    try {
      const result = await this.service.forgotPassword(req.body.email);
      return success(res, result, 'If an account exists, reset instructions have been sent');
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const result = await this.service.resetPassword(req.body.token, req.body.newPassword);
      return success(res, result, 'Password updated');
    } catch (err) {
      next(err);
    }
  };

  sendOtp = async (req, res, next) => {
    try {
      const result = await this.service.sendOtp(req.body.identifier, req.body.type);
      return success(res, result, 'If an account exists, a code has been sent');
    } catch (err) {
      next(err);
    }
  };

  verifyOtp = async (req, res, next) => {
    try {
      const result = await this.service.verifyOtp(req.body.identifier, req.body.code, req.body.type);
      return success(res, result, 'OTP verified');
    } catch (err) {
      next(err);
    }
  };

  _sessionContext(req) {
    return {
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
    };
  }
}

module.exports = { AuthController };
