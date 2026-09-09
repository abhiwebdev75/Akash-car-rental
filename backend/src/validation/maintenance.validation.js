/**
 * Maintenance validation. A maintenance window must not collide with a blocking
 * booking (enforced in the service); here we validate shape only.
 */
const { Joi, objectId, pagination } = require('./common');
const { MAINTENANCE_TYPE, MAINTENANCE_STATUS, enumValues } = require('../config/constants');

const schedule = {
  body: Joi.object({
    vehicleId: objectId.required(),
    type: Joi.string().valid(...enumValues(MAINTENANCE_TYPE)).required(),
    description: Joi.string().max(1000).allow(''),
    scheduledStart: Joi.date().iso().required(),
    scheduledEnd: Joi.date().iso().greater(Joi.ref('scheduledStart')).required(),
    vendor: Joi.string().max(200).allow(''),
    cost: Joi.number().min(0),
    notes: Joi.string().max(1000).allow(''),
  }),
};

const complete = {
  body: Joi.object({
    cost: Joi.number().min(0),
    odometerAtService: Joi.number().min(0),
    notes: Joi.string().max(1000).allow(''),
  }),
};

const list = {
  query: Joi.object({
    vehicleId: objectId,
    status: Joi.string().valid(...enumValues(MAINTENANCE_STATUS)),
    ...pagination,
  }),
};

module.exports = { schedule, complete, list };
