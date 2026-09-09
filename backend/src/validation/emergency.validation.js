/**
 * Emergency request validation.
 */
const { Joi, objectId } = require('./common');
const { EMERGENCY_TYPE, EMERGENCY_STATUS, enumValues } = require('../config/constants');

const photo = Joi.object({
  url: Joi.string().uri({ allowRelative: true }).required(),
  publicId: Joi.string().allow(''),
});

const create = {
  body: Joi.object({
    bookingId: objectId.required(),
    type: Joi.string().valid(...enumValues(EMERGENCY_TYPE)).required(),
    description: Joi.string().max(1000).allow(''),
    location: Joi.object({
      text: Joi.string().max(300).allow(''),
      lat: Joi.number(),
      lng: Joi.number(),
    }),
    phone: Joi.string().max(20).allow(''),
    photos: Joi.array().items(photo).default([]),
  }),
};

const updateStatus = {
  body: Joi.object({
    status: Joi.string().valid(...enumValues(EMERGENCY_STATUS)).required(),
  }),
};

const list = {
  query: Joi.object({
    status: Joi.string().valid(...enumValues(EMERGENCY_STATUS)),
    bookingId: objectId,
    customerId: objectId,
  }),
};

module.exports = { create, updateStatus, list };
