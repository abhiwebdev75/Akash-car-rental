/**
 * User validation. Covers admin user management (creating staff, updating role/
 * status/location) and self-service profile updates. Registration/login live in
 * auth.validation. Note: role is assigned by admins here, never self-selected.
 */
const { Joi, objectId, pagination } = require('./common');
const { ROLES, USER_STATUS, enumValues } = require('../config/constants');

const address = Joi.object({
  line1: Joi.string().max(200).allow(''),
  city: Joi.string().max(100).allow(''),
  state: Joi.string().max(100).allow(''),
  pincode: Joi.string().max(12).allow(''),
});

const list = {
  query: Joi.object({
    role: Joi.string().valid(...enumValues(ROLES)),
    status: Joi.string().valid(...enumValues(USER_STATUS)),
    q: Joi.string().max(120).allow(''),
    ...pagination,
  }),
};

// Admin creates a staff account (OWNER/MANAGER/STAFF/ACCOUNTANT).
const createStaff = {
  body: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(20).allow(''),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string()
      .valid(ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.ACCOUNTANT)
      .required(),
    assignedLocation: objectId,
  }),
};

const updateUser = {
  body: Joi.object({
    name: Joi.string().min(2).max(120),
    phone: Joi.string().max(20).allow(''),
    role: Joi.string().valid(...enumValues(ROLES)),
    status: Joi.string().valid(...enumValues(USER_STATUS)),
    assignedLocation: objectId.allow(null),
  }).min(1),
};

// Self-service profile update (no role/status changes).
const updateProfile = {
  body: Joi.object({
    name: Joi.string().min(2).max(120),
    phone: Joi.string().max(20).allow(''),
    address,
    profilePhoto: Joi.object({
      url: Joi.string().uri({ allowRelative: true }).allow(''),
      publicId: Joi.string().allow(''),
    }),
  }).min(1),
};

module.exports = { list, createStaff, updateUser, updateProfile };
