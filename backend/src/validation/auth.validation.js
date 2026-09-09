/**
 * Auth request validation schemas.
 */
const { Joi } = require('./common');

const password = Joi.string().min(8).max(128);

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

module.exports = { register, login, refresh, changePassword };
