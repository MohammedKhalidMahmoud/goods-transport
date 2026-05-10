const Joi = require('joi');

const loginSchema = {
  body: Joi.object({
    identifier: Joi.string().required().messages({
      'string.empty': 'Email or phone is required',
      'any.required': 'Email or phone is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
  }),
};

const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required',
    }),
  }),
};

const logoutSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required',
    }),
  }),
};

const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),
};

const sendOtpSchema = {
  body: Joi.object({
    identifier: Joi.string().required(),
    type: Joi.string().valid('email', 'phone').required(),
  }),
};

const verifyOtpSchema = {
  body: Joi.object({
    identifier: Joi.string().required(),
    code: Joi.string().pattern(/^\d{4,8}$/).required(),
    type: Joi.string().valid('email', 'phone').required(),
  }),
};

module.exports = {
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
};
