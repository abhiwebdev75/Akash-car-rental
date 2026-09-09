/**
 * Coupon validation. All coupon rules are enforced server-side; this validates
 * admin CRUD plus the customer-facing "check this code" preview.
 */
const { Joi, objectId } = require('./common');
const { COUPON_TYPE, enumValues } = require('../config/constants');

const base = {
  code: Joi.string().min(2).max(40).uppercase().trim(),
  type: Joi.string().valid(...enumValues(COUPON_TYPE)),
  value: Joi.number().min(0),
  minimumRental: Joi.number().min(0),
  maximumDiscount: Joi.number().min(0),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  usageLimit: Joi.number().integer().min(0),
  active: Joi.boolean(),
};

const create = {
  body: Joi.object({
    ...base,
    code: base.code.required(),
    type: base.type.required(),
    value: base.value.required(),
  }),
};

const update = { body: Joi.object(base).min(1) };

// Customer/staff preview of a code against a subtotal.
const check = {
  body: Joi.object({
    code: Joi.string().required(),
    subtotal: Joi.number().min(0).default(0),
  }),
};

module.exports = { create, update, check };
