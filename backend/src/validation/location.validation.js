/**
 * Location validation.
 */
const { Joi, objectId } = require('./common');

const base = {
  name: Joi.string().min(2).max(120),
  code: Joi.string().min(2).max(12),
  address: Joi.string().min(3).max(300),
  city: Joi.string().min(2).max(120),
  state: Joi.string().max(120).allow(''),
  pincode: Joi.string().max(12).allow(''),
  phone: Joi.string().max(20).allow(''),
  manager: objectId.allow(null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  geo: Joi.object({ lat: Joi.number(), lng: Joi.number() }),
};

const create = {
  body: Joi.object({
    ...base,
    name: base.name.required(),
    code: base.code.required(),
    address: base.address.required(),
    city: base.city.required(),
  }),
};

const update = { body: Joi.object(base).min(1) };

module.exports = { create, update };
