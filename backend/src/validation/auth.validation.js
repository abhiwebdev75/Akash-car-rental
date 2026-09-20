/**
 * Auth request validation schemas.
 */
const { Joi } = require('./common');

const password = Joi.string().min(8).max(128);
const otpCode = Joi.string()
  .trim()
  .pattern(/^\d{6}$/)
  .message('Enter the 6-digit code');

const register = {
  body: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(7).max(20).required(),
    password: password.required(),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const refresh = {
  body: Joi.object({
    refreshToken: Joi.string().optional(), // may also come from cookie
  }),
};

const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: password.required(),
  }),
};

const verifyEmail = {
  body: Joi.object({
    email: Joi.string().email().required(),
    code: otpCode.required(),
  }),
};

const resendVerification = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const forgotPassword = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object({
    email: Joi.string().email().required(),
    code: otpCode.required(),
    newPassword: password.required(),
  }),
};

module.exports = {
  register,
  login,
  refresh,
  changePassword,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
