/**
 * Settings validation — the owner configures business data (no hardcoding).
 * All fields optional; at least one must be present.
 */
const { Joi } = require('./common');

const update = {
  body: Joi.object({
    businessName: Joi.string().max(200),
    logo: Joi.object({ url: Joi.string().uri({ allowRelative: true }).allow(''), publicId: Joi.string().allow('') }),
    phone: Joi.string().max(20).allow(''),
    email: Joi.string().email().allow(''),
    whatsapp: Joi.string().max(20).allow(''),
    address: Joi.string().max(500).allow(''),
    currency: Joi.string().max(8),
    taxRate: Joi.number().min(0).max(1),
    policies: Joi.object({
      terms: Joi.string().allow(''),
      cancellation: Joi.string().allow(''),
      fuel: Joi.string().allow(''),
      mileage: Joi.string().allow(''),
    }),
    booking: Joi.object({
      turnoverBufferMinutes: Joi.number().integer().min(0),
      minRentalHours: Joi.number().integer().min(1),
      cancellationWindowHours: Joi.number().integer().min(0),
    }),
    charges: Joi.object({
      lateFeePerHour: Joi.number().min(0),
      fuelChargePerUnit: Joi.number().min(0),
    }),
  }).min(1),
};

module.exports = { update };
