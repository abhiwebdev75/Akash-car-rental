/**
 * Vehicle validation — catalog CRUD, availability search, and browse filters.
 */
const { Joi, objectId, dateOnly } = require('./common');
const {
  VEHICLE_TYPE,
  TRANSMISSION,
  FUEL_TYPE,
  VEHICLE_STATUS,
  enumValues,
} = require('../config/constants');

const base = {
  brand: Joi.string().max(60),
  model: Joi.string().max(60),
  variant: Joi.string().max(60).allow(''),
  year: Joi.number().integer().min(1980).max(2100),
  registrationNumber: Joi.string().max(20),
  vehicleType: Joi.string().valid(...enumValues(VEHICLE_TYPE)),
  transmission: Joi.string().valid(...enumValues(TRANSMISSION)),
  fuelType: Joi.string().valid(...enumValues(FUEL_TYPE)),
  seats: Joi.number().integer().min(1).max(60),
  luggageCapacity: Joi.number().integer().min(0),
  description: Joi.string().max(2000).allow(''),
  features: Joi.array().items(Joi.string().max(60)),
  locationId: objectId,
  status: Joi.string().valid(...enumValues(VEHICLE_STATUS)),
  dailyPrice: Joi.number().min(0),
  weeklyPrice: Joi.number().min(0),
  monthlyPrice: Joi.number().min(0),
  securityDeposit: Joi.number().min(0),
  extraKmPrice: Joi.number().min(0),
  kmPerDayAllowance: Joi.number().min(0),
  currentMileage: Joi.number().min(0),
  nextServiceMileage: Joi.number().min(0),
  lastServiceDate: dateOnly,
  insuranceExpiry: dateOnly,
  pucExpiry: dateOnly,
};

const create = {
  body: Joi.object({
    ...base,
    brand: base.brand.required(),
    model: base.model.required(),
    registrationNumber: base.registrationNumber.required(),
    vehicleType: base.vehicleType.required(),
    transmission: base.transmission.required(),
    fuelType: base.fuelType.required(),
    seats: base.seats.required(),
    locationId: base.locationId.required(),
    dailyPrice: base.dailyPrice.required(),
  }),
};

const update = { body: Joi.object(base).min(1) };

// Browse/list filters (public).
const browse = {
  query: Joi.object({
    locationId: objectId,
    vehicleType: Joi.string().valid(...enumValues(VEHICLE_TYPE)),
    transmission: Joi.string().valid(...enumValues(TRANSMISSION)),
    fuelType: Joi.string().valid(...enumValues(FUEL_TYPE)),
    minSeats: Joi.number().integer().min(1),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    features: Joi.array().items(Joi.string()).single(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().default('dailyPrice'),
  }),
};

// Availability search requires a date/time range.
const availability = {
  query: Joi.object({
    locationId: objectId,
    start: Joi.date().iso().required(),
    end: Joi.date().iso().greater(Joi.ref('start')).required(),
    vehicleType: Joi.string().valid(...enumValues(VEHICLE_TYPE)),
    transmission: Joi.string().valid(...enumValues(TRANSMISSION)),
    fuelType: Joi.string().valid(...enumValues(FUEL_TYPE)),
    minSeats: Joi.number().integer().min(1),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    features: Joi.array().items(Joi.string()).single(),
  }),
};

module.exports = { create, update, browse, availability };
