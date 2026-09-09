/**
 * Damage validation. Photos are already-uploaded references ({ url, publicId }).
 */
const { Joi, objectId, pagination } = require('./common');
const { DAMAGE_SEVERITY, DAMAGE_STATUS, enumValues } = require('../config/constants');

const photo = Joi.object({
  url: Joi.string().uri({ allowRelative: true }).required(),
  publicId: Joi.string().allow(''),
});

const report = {
  body: Joi.object({
    vehicleId: objectId.required(),
    bookingId: objectId,
    type: Joi.string().max(60).allow(''),
    description: Joi.string().max(1000).allow(''),
    severity: Joi.string().valid(...enumValues(DAMAGE_SEVERITY)),
    photos: Joi.array().items(photo).default([]),
    estimatedCost: Joi.number().min(0),
  }),
};

const update = {
  body: Joi.object({
    status: Joi.string().valid(...enumValues(DAMAGE_STATUS)),
    estimatedCost: Joi.number().min(0),
    finalCost: Joi.number().min(0),
    description: Joi.string().max(1000).allow(''),
  }).min(1),
};

const list = {
  query: Joi.object({
    vehicleId: objectId,
    bookingId: objectId,
    status: Joi.string().valid(...enumValues(DAMAGE_STATUS)),
    ...pagination,
  }),
};

module.exports = { report, update, list };
