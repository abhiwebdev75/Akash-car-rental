/**
 * Inspection validation. Photos are provided as already-uploaded references
 * ({ category, url, publicId }); the frontend uploads files via /api/uploads
 * first, then submits the inspection.
 */
const { Joi, objectId } = require('./common');
const { INSPECTION_TYPE, CONDITION, PHOTO_CATEGORY, enumValues } = require('../config/constants');

const photo = Joi.object({
  category: Joi.string().valid(...enumValues(PHOTO_CATEGORY)).required(),
  url: Joi.string().uri({ allowRelative: true }).required(),
  publicId: Joi.string().allow(''),
});

const create = {
  body: Joi.object({
    bookingId: objectId.required(),
    type: Joi.string().valid(...enumValues(INSPECTION_TYPE)).required(),
    odometer: Joi.number().min(0).required(),
    fuelLevel: Joi.number().min(0).max(100),
    exteriorCondition: Joi.string().valid(...enumValues(CONDITION)),
    interiorCondition: Joi.string().valid(...enumValues(CONDITION)),
    tyreCondition: Joi.string().valid(...enumValues(CONDITION)),
    existingDamage: Joi.string().max(1000).allow(''),
    notes: Joi.string().max(1000).allow(''),
    photos: Joi.array().items(photo).default([]),
    customerConfirmed: Joi.boolean().default(false),
    customerSignature: Joi.string().allow(''),
    performedAt: Joi.date().iso(),
  }),
};

module.exports = { create };
