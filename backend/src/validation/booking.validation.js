/**
 * Booking validation — quote, create, list filters, and cancel.
 */
const { Joi, objectId, timeString } = require('./common');
const { BOOKING_STATUS, enumValues } = require('../config/constants');

const addOnItem = Joi.object({
  addOnId: objectId.required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const quote = {
  body: Joi.object({
    vehicleId: objectId.required(),
    pickupDate: Joi.date().iso().required(),
    returnDate: Joi.date().iso().greater(Joi.ref('pickupDate')).required(),
    pickupTime: timeString.default('10:00'),
    returnTime: timeString.default('10:00'),
    addOns: Joi.array().items(addOnItem).default([]),
    couponCode: Joi.string().max(40).allow('', null),
  }),
};

const create = {
  body: Joi.object({
    vehicleId: objectId.required(),
    // Only honored for staff-created bookings; customers book for themselves.
    customerId: objectId,
    locationId: objectId.required(),
    pickupDate: Joi.date().iso().required(),
    returnDate: Joi.date().iso().greater(Joi.ref('pickupDate')).required(),
    pickupTime: timeString.default('10:00'),
    returnTime: timeString.default('10:00'),
    addOns: Joi.array().items(addOnItem).default([]),
    couponCode: Joi.string().max(40).allow('', null),
    specialRequests: Joi.string().max(1000).allow(''),
  }),
};

const list = {
  query: Joi.object({
    status: Joi.string().valid(...enumValues(BOOKING_STATUS)),
    customerId: objectId,
    vehicleId: objectId,
    locationId: objectId,
    from: Joi.date().iso(),
    to: Joi.date().iso(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().default('-createdAt'),
  }),
};

const calendar = {
  query: Joi.object({
    locationId: objectId,
    from: Joi.date().iso().required(),
    to: Joi.date().iso().greater(Joi.ref('from')).required(),
  }),
};

const cancel = {
  body: Joi.object({ reason: Joi.string().max(500).allow('') }),
};

module.exports = { quote, create, list, calendar, cancel };
