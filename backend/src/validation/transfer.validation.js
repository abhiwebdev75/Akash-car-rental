/**
 * Vehicle transfer validation.
 */
const { Joi, objectId } = require('./common');

const create = {
  body: Joi.object({
    vehicleId: objectId.required(),
    toLocationId: objectId.required(),
    reason: Joi.string().max(500).allow(''),
    // When true (default) the transfer completes immediately; false records an
    // in-transit move finalized later.
    complete: Joi.boolean().default(true),
  }),
};

const list = {
  query: Joi.object({
    vehicleId: objectId,
    locationId: objectId,
  }),
};

module.exports = { create, list };
