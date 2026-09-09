/**
 * Review validation. A customer reviews their own COMPLETED booking (enforced
 * in the service). Visibility/featured toggles are staff-only.
 */
const { Joi, objectId } = require('./common');
const { REVIEW_STATUS, enumValues } = require('../config/constants');

const create = {
  body: Joi.object({
    bookingId: objectId.required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().max(2000).allow(''),
  }),
};

const setVisibility = {
  body: Joi.object({
    status: Joi.string().valid(...enumValues(REVIEW_STATUS)).required(),
  }),
};

const setFeatured = {
  body: Joi.object({
    featured: Joi.boolean().required(),
  }),
};

const listForVehicle = {
  query: Joi.object({
    includeHidden: Joi.boolean().default(false),
  }),
};

module.exports = { create, setVisibility, setFeatured, listForVehicle };
