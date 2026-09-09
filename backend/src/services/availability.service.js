/**
 * Availability service — the DB-backed layer over the pure availability core.
 *
 * Responsibilities:
 *  - translate a search (location + date range + filters) into candidate
 *    vehicles and their blocking intervals (bookings + maintenance),
 *  - delegate the actual conflict decision to the pure core,
 *  - expose `assertVehicleAvailable` for the transactional write path so bookings
 *    are re-checked for conflicts before insert.
 *
 * The backend is the single source of truth for availability.
 */
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Maintenance = require('../models/Maintenance');
const Settings = require('../models/Settings');
const core = require('./availability.core');
const ApiError = require('../utils/ApiError');
const { VEHICLE_NON_BOOKABLE_STATUSES, BLOCKING_MAINTENANCE_STATUSES } = require('../config/constants');

const MINUTE_MS = 60 * 1000;

function bufferMsFromSettings(settings) {
  return (settings?.booking?.turnoverBufferMinutes || 0) * MINUTE_MS;
}

function blockingStatusesFromSettings(settings) {
  return settings?.booking?.blockingStatuses || [];
}

/** Build the Mongoose filter for candidate vehicles from optional criteria. */
function buildVehicleQuery({ locationId, filters = {} }) {
  const query = { status: { $nin: [...VEHICLE_NON_BOOKABLE_STATUSES] } };
  if (locationId) query.locationId = locationId;
  if (filters.vehicleType) query.vehicleType = filters.vehicleType;
  if (filters.transmission) query.transmission = filters.transmission;
  if (filters.fuelType) query.fuelType = filters.fuelType;
  if (filters.minSeats) query.seats = { $gte: Number(filters.minSeats) };
  if (filters.features && filters.features.length) {
    query.features = { $all: filters.features };
  }
  const price = {};
  if (filters.minPrice != null) price.$gte = Number(filters.minPrice);
  if (filters.maxPrice != null) price.$lte = Number(filters.maxPrice);
  if (Object.keys(price).length) query.dailyPrice = price;
  return query;
}

/**
 * Fetch blocking intervals (bookings + maintenance) for the given vehicle ids
 * that could overlap [start, end] (widened by buffer), grouped by vehicle id.
 */
async function getBlockingIntervals(vehicleIds, start, end, { session, bufferMs, blockingStatuses, excludeBookingId } = {}) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const lo = new Date(startMs - bufferMs);
  const hi = new Date(endMs + bufferMs);

  const bookingFilter = {
    vehicleId: { $in: vehicleIds },
    status: { $in: blockingStatuses },
    startAt: { $lt: hi },
    endAt: { $gt: lo },
  };
  if (excludeBookingId) bookingFilter._id = { $ne: excludeBookingId };

  const maintenanceFilter = {
    vehicleId: { $in: vehicleIds },
    status: { $in: [...BLOCKING_MAINTENANCE_STATUSES] },
    scheduledStart: { $lt: hi },
    scheduledEnd: { $gt: lo },
  };

  const [bookings, maintenance] = await Promise.all([
    Booking.find(bookingFilter).select('vehicleId startAt endAt').session(session || null).lean(),
    Maintenance.find(maintenanceFilter).select('vehicleId scheduledStart scheduledEnd').session(session || null).lean(),
  ]);

  const map = new Map();
  const push = (vehicleId, interval) => {
    const key = String(vehicleId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(interval);
  };
  bookings.forEach((b) => push(b.vehicleId, { start: b.startAt, end: b.endAt }));
  maintenance.forEach((m) => push(m.vehicleId, { start: m.scheduledStart, end: m.scheduledEnd }));
  return map;
}

/**
 * Return the vehicles available at a location for a date/time range, applying
 * optional filters. This is the endpoint behind the customer's "Find Cars".
 */
async function getAvailableVehicles({ locationId, start, end, filters = {} }) {
  const settings = await Settings.getSettings();
  const bufferMs = bufferMsFromSettings(settings);
  const blockingStatuses = blockingStatusesFromSettings(settings);

  const vehicles = await Vehicle.find(buildVehicleQuery({ locationId, filters }))
    .populate('locationId', 'name city code')
    .lean({ virtuals: true });

  if (!vehicles.length) return [];

  const vehicleIds = vehicles.map((v) => v._id);
  const intervalsByVehicle = await getBlockingIntervals(vehicleIds, start, end, {
    bufferMs,
    blockingStatuses,
  });

  return core.filterAvailable({ vehicles, intervalsByVehicle, start, end, bufferMs });
}

/**
 * Assert that a specific vehicle is available for [start, end]; throws a 404/409
 * ApiError otherwise. Used inside the booking transaction (pass the session) to
 * prevent double-booking. `excludeBookingId` lets a booking be revalidated
 * against everything except itself (e.g. date changes).
 */
async function assertVehicleAvailable(vehicleId, start, end, { session, excludeBookingId } = {}) {
  const settings = await Settings.getSettings();
  const bufferMs = bufferMsFromSettings(settings);
  const blockingStatuses = blockingStatusesFromSettings(settings);

  const vehicle = await Vehicle.findById(vehicleId).session(session || null);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (core.isNonBookableStatus(vehicle.status)) {
    throw ApiError.conflict(`Vehicle is currently ${vehicle.status.toLowerCase()} and cannot be booked`);
  }

  const intervalsByVehicle = await getBlockingIntervals([vehicleId], start, end, {
    session,
    bufferMs,
    blockingStatuses,
    excludeBookingId,
  });
  const intervals = intervalsByVehicle.get(String(vehicleId)) || [];

  const available = core.isVehicleAvailable({ status: vehicle.status, intervals, start, end, bufferMs });
  if (!available) {
    throw ApiError.conflict('Vehicle is not available for the selected dates.');
  }
  return vehicle;
}

module.exports = {
  getAvailableVehicles,
  assertVehicleAvailable,
  getBlockingIntervals,
  buildVehicleQuery,
  bufferMsFromSettings,
};
