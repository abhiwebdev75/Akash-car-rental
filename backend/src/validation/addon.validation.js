/**
 * AddOn validation.
 */
const { Joi } = require('./common');
const { ADDON_PRICING_TYPE, enumValues } = require('../config/constants');

const base = {
  name: Joi.string().min(2).max(120),
  description: Joi.string().max(500).allow(''),
  price: Joi.number().min(0),
  pricingType: Joi.string().valid(...enumValues(ADDON_PRICING_TYPE)),
  maxQuantity: Joi.number().integer().min(1),
  active: Joi.boolean(),
};

const create = {
  body: Joi.object({
    ...base,
    name: base.name.required(),
    price: base.price.required(),
  }),
};

const update = { body: Joi.object(base).min(1) };

module.exports = { create, update };
