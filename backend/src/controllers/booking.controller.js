/**
 * Booking controller — request/response layer over the booking service. It
 * enforces WHO may act (customers act on their own bookings; staff act within
 * their location scope) and delegates all availability/pricing/lifecycle logic
 * to the service, which is the source of truth.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Booking = require('../models/Booking');
const bookingService = require('../services/booking.service');
const { getPagination, getSort } = require('../utils/pagination');
const { isLocationScoped, assertLocationAccess } = require('../middleware/rbac.middleware');
const { ROLES } = require('../config/constants');

/** A trusted price quote — no side effects. */
const quote = asyncHandler(async (req, res) => {
  const result = await bookingService.quoteBooking(req.body);
  return sendSuccess(res, result);
});

/** Create a booking. Customers book for themselves; staff may book for a customer. */
const create = asyncHandler(async (req, res) => {
  const acting = req.user;
  let customerId;
  if (acting.role === ROLES.CUSTOMER) {
    customerId = acting._id; // customers can only book for themselves
  } else {
    customerId = req.body.customerId;
    if (!customerId) throw ApiError.badRequest('customerId is required when staff create a booking');
  }

  // Location-scoped staff may only create bookings at their own location.
  assertLocationAccess(acting, req.body.locationId);

  const booking = await bookingService.createBooking({
    ...req.body,
    customerId,
    createdBy: acting._id,
  });
  return sendCreated(res, booking);
});

/** List bookings, scoped by role. */
const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query.sort);
  const acting = req.user;
  const filter = {};

  if (acting.role === ROLES.CUSTOMER) {
    filter.customerId = acting._id;
  } else {
    if (req.query.customerId) filter.customerId = req.query.customerId;
    if (isLocationScoped(acting)) filter.locationId = acting.assignedLocation;
    else if (req.query.locationId) filter.locationId = req.query.locationId;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
  if (req.query.from || req.query.to) {
    filter.startAt = {};
    if (req.query.from) filter.startAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.startAt.$lte = new Date(req.query.to);
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('vehicleId', 'brand model registrationNumber images')
      .populate('customerId', 'name email phone')
      .populate('locationId', 'name city code')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Booking.countDocuments(filter),
  ]);
  return sendPaginated(res, bookings, { page, limit, total });
});

/** Fetch one booking, enforcing ownership/location scope. */
const getById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingOrThrow(req.params.id, true);
  const acting = req.user;
  if (acting.role === ROLES.CUSTOMER && String(booking.customerId._id || booking.customerId) !== String(acting._id)) {
    throw ApiError.forbidden('You can only view your own bookings');
  }
  if (isLocationScoped(acting)) {
    assertLocationAccess(acting, booking.locationId._id || booking.locationId);
  }
  return sendSuccess(res, booking);
});

const confirm = asyncHandler(async (req, res) =>
  sendSuccess(res, await bookingService.confirmBooking(req.params.id), { message: 'Booking confirmed' })
);

const activate = asyncHandler(async (req, res) =>
  sendSuccess(res, await bookingService.activateBooking(req.params.id), { message: 'Booking activated (vehicle picked up)' })
);

const complete = asyncHandler(async (req, res) =>
  sendSuccess(res, await bookingService.completeBooking(req.params.id), { message: 'Booking completed (vehicle returned)' })
);

/** Cancel — customers may cancel their own; staff may cancel any (in scope). */
const cancel = asyncHandler(async (req, res) => {
  const acting = req.user;
  const booking = await bookingService.getBookingOrThrow(req.params.id);
  if (acting.role === ROLES.CUSTOMER && String(booking.customerId) !== String(acting._id)) {
    throw ApiError.forbidden('You can only cancel your own bookings');
  }
  if (isLocationScoped(acting)) assertLocationAccess(acting, booking.locationId);

  const updated = await bookingService.cancelBooking(req.params.id, {
    by: acting._id,
    reason: req.body.reason,
  });
  return sendSuccess(res, updated, { message: 'Booking cancelled' });
});

const calendar = asyncHandler(async (req, res) => {
  const acting = req.user;
  const locationId = isLocationScoped(acting) ? acting.assignedLocation : req.query.locationId;
  const data = await bookingService.getCalendar({ locationId, from: req.query.from, to: req.query.to });
  return sendSuccess(res, data);
});

module.exports = { quote, create, list, getById, confirm, activate, complete, cancel, calendar };
