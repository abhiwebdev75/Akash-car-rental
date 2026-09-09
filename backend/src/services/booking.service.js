/**
 * Booking service — orchestrates quoting, creation (with transactional
 * double-booking prevention), lifecycle transitions, and cancellation.
 *
 * Correctness priorities: availability, booking conflicts, pricing, vehicle
 * location, and vehicle status — all decided here on the server.
 */
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const AddOn = require('../models/AddOn');
const Settings = require('../models/Settings');
const pricing = require('./pricing.service');
const availabilityService = require('./availability.service');
const couponService = require('./coupon.service');
const bookingNumberService = require('./bookingNumber.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');
const { combineDateTime, rentalDays, hoursBetween } = require('../utils/dates');
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  VEHICLE_STATUS,
} = require('../config/constants');

/** Whether an error indicates the deployment doesn't support transactions. */
function isTxnUnsupported(err) {
  const msg = String((err && err.message) || '');
  return (
    err?.code === 20 ||
    /Transaction numbers are only allowed on a replica set|replica set|does not support transactions|Transactions are not supported/i.test(
      msg
    )
  );
}

/**
 * Run `work(session)` inside a transaction when the deployment supports it
 * (MongoDB Atlas does). Falls back to a session-less run on standalone servers
 * so local dev without a replica set still works; the in-transaction re-check
 * still guards against double-booking under the common case.
 */
async function runInTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (isTxnUnsupported(err)) {
      return work(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

/** Resolve requested add-ons into a priced, validated form. */
async function buildPricedAddOns(addOns = [], session = null) {
  if (!addOns.length) return [];
  const ids = addOns.map((a) => a.addOnId);
  const docs = await AddOn.find({ _id: { $in: ids }, active: true }).session(session || null);
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return addOns.map((a) => {
    const d = byId.get(String(a.addOnId));
    if (!d) throw ApiError.badRequest('Invalid or inactive add-on selected');
    const quantity = Math.min(Math.max(1, Number(a.quantity) || 1), d.maxQuantity || 1);
    return {
      addOnId: d._id,
      name: d.name,
      pricingType: d.pricingType,
      unitPrice: d.price,
      quantity,
    };
  });
}

/** Validate the requested date range against business rules. */
function validateRange(startAt, endAt, settings, { allowPast = false } = {}) {
  if (!(startAt.getTime() < endAt.getTime())) {
    throw ApiError.badRequest('Return date/time must be after pickup');
  }
  const minHours = settings?.booking?.minRentalHours || 1;
  if (hoursBetween(startAt, endAt) < minHours) {
    throw ApiError.badRequest(`Minimum rental duration is ${minHours} hour(s)`);
  }
  if (!allowPast && startAt.getTime() < Date.now() - 60 * 1000) {
    throw ApiError.badRequest('Pickup date/time cannot be in the past');
  }
}

/**
 * Produce a trusted price quote for a prospective booking (no DB writes).
 */
async function quoteBooking({
  vehicleId,
  pickupDate,
  returnDate,
  pickupTime = '10:00',
  returnTime = '10:00',
  addOns = [],
  couponCode,
}) {
  const settings = await Settings.getSettings();
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const startAt = combineDateTime(pickupDate, pickupTime);
  const endAt = combineDateTime(returnDate, returnTime);
  validateRange(startAt, endAt, settings, { allowPast: true });

  const days = rentalDays(startAt, endAt);
  const priced = await buildPricedAddOns(addOns);
  const addOnsResult = pricing.computeAddOns(priced, days);
  const subtotal = pricing.round2(pricing.computeBaseRental(vehicle, days).base + addOnsResult.total);
  const coupon = couponCode ? await couponService.validateCode(couponCode, subtotal) : null;

  const quote = pricing.quote({ vehicle, days, addOns: priced, coupon, taxRate: settings.taxRate });
  return { vehicleId: vehicle._id, startAt, endAt, currency: settings.currency, quote };
}

/**
 * Create a booking. Runs the availability re-check + insert inside a
 * transaction so two simultaneous requests can never both win the same slot.
 */
async function createBooking(input) {
  const {
    vehicleId,
    customerId,
    locationId,
    pickupDate,
    returnDate,
    pickupTime = '10:00',
    returnTime = '10:00',
    addOns = [],
    couponCode,
    specialRequests = '',
    createdBy,
  } = input;

  const settings = await Settings.getSettings();
  const startAt = combineDateTime(pickupDate, pickupTime);
  const endAt = combineDateTime(returnDate, returnTime);
  validateRange(startAt, endAt, settings);

  const booking = await runInTransaction(async (session) => {
    // Re-check availability inside the transaction — the double-booking guard.
    const vehicle = await availabilityService.assertVehicleAvailable(vehicleId, startAt, endAt, {
      session,
    });

    // The vehicle must belong to the selected pickup location.
    if (String(vehicle.locationId) !== String(locationId)) {
      throw ApiError.badRequest('Selected vehicle does not belong to the chosen location');
    }

    const days = rentalDays(startAt, endAt);
    const priced = await buildPricedAddOns(addOns, session);
    const addOnsResult = pricing.computeAddOns(priced, days);
    const subtotal = pricing.round2(
      pricing.computeBaseRental(vehicle, days).base + addOnsResult.total
    );
    const coupon = couponCode ? await couponService.validateCode(couponCode, subtotal) : null;
    const q = pricing.quote({ vehicle, days, addOns: priced, coupon, taxRate: settings.taxRate });

    const bookingNumber = await bookingNumberService.nextBookingNumber(new Date(), session);

    const [created] = await Booking.create(
      [
        {
          bookingNumber,
          customerId,
          vehicleId,
          locationId,
          returnLocationId: locationId,
          pickupDate: startAt,
          returnDate: endAt,
          pickupTime,
          returnTime,
          startAt,
          endAt,
          status: BOOKING_STATUS.PENDING,
          addOns: q.addOns,
          couponId: coupon ? coupon._id : undefined,
          pricingBreakdown: {
            days: q.days,
            baseStrategy: q.baseStrategy,
            base: q.base,
            addOnsTotal: q.addOnsTotal,
            subtotal: q.subtotal,
          },
          discount: q.discount,
          tax: q.tax,
          taxRate: q.taxRate,
          securityDeposit: q.securityDeposit,
          totalAmount: q.total,
          amountPaid: 0,
          paymentStatus: PAYMENT_STATUS.PENDING,
          specialRequests,
          createdBy: createdBy || customerId,
        },
      ],
      { session }
    );

    if (coupon) await couponService.redeem(coupon._id, session);
    return created;
  });

  notificationService.onBookingCreated(booking).catch(() => {});
  return booking;
}

/** Load a booking or throw 404. */
async function getBookingOrThrow(id, populate = false) {
  let query = Booking.findById(id);
  if (populate) {
    query = query
      .populate('vehicleId', 'brand model variant registrationNumber images dailyPrice locationId')
      .populate('customerId', 'name email phone')
      .populate('locationId', 'name city code');
  }
  const booking = await query;
  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
}

async function confirmBooking(id) {
  const booking = await getBookingOrThrow(id);
  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw ApiError.unprocessable(`Only pending bookings can be confirmed (current: ${booking.status})`);
  }
  booking.status = BOOKING_STATUS.CONFIRMED;
  await booking.save();
  notificationService.onBookingConfirmed(booking).catch(() => {});
  return booking;
}

/** CONFIRMED → ACTIVE (vehicle picked up). Marks the vehicle RENTED. */
async function activateBooking(id) {
  const booking = await getBookingOrThrow(id);
  if (![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING].includes(booking.status)) {
    throw ApiError.unprocessable(`Cannot activate a booking in status ${booking.status}`);
  }
  booking.status = BOOKING_STATUS.ACTIVE;
  await booking.save();
  await Vehicle.findByIdAndUpdate(booking.vehicleId, { status: VEHICLE_STATUS.RENTED });
  return booking;
}

/** ACTIVE → COMPLETED (vehicle returned). Frees the vehicle, updates loyalty. */
async function completeBooking(id) {
  const booking = await getBookingOrThrow(id);
  if (booking.status !== BOOKING_STATUS.ACTIVE) {
    throw ApiError.unprocessable(`Only active bookings can be completed (current: ${booking.status})`);
  }
  booking.status = BOOKING_STATUS.COMPLETED;
  await booking.save();

  // Free the vehicle only if it has no other currently-active booking.
  const otherActive = await Booking.countDocuments({
    vehicleId: booking.vehicleId,
    status: BOOKING_STATUS.ACTIVE,
    _id: { $ne: booking._id },
  });
  if (!otherActive) {
    await Vehicle.findByIdAndUpdate(booking.vehicleId, { status: VEHICLE_STATUS.AVAILABLE });
  }

  // Optional loyalty accrual (does not affect the booking flow).
  const User = require('../models/User');
  await User.findByIdAndUpdate(booking.customerId, {
    $inc: {
      'loyalty.completedRentals': 1,
      'loyalty.totalSpend': booking.totalAmount || 0,
      'loyalty.points': Math.floor((booking.totalAmount || 0) / 100),
    },
  });
  return booking;
}

/** Cancel a PENDING/CONFIRMED booking (policy-aware). */
async function cancelBooking(id, { by, reason = '' } = {}) {
  const booking = await getBookingOrThrow(id);
  if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(booking.status)) {
    throw ApiError.unprocessable(`Cannot cancel a booking in status ${booking.status}`);
  }
  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancellation = {
    at: new Date(),
    by,
    reason,
    // Refund what was paid; real refund is recorded via the payment service.
    refundAmount: booking.amountPaid || 0,
  };
  await booking.save();
  notificationService.onBookingCancelled(booking).catch(() => {});
  return booking;
}

/**
 * Calendar data: bookings whose range intersects [from, to], optionally scoped
 * to a location, with light vehicle info for the grid.
 */
async function getCalendar({ locationId, from, to }) {
  const filter = {
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE] },
    startAt: { $lt: new Date(to) },
    endAt: { $gt: new Date(from) },
  };
  if (locationId) filter.locationId = locationId;
  return Booking.find(filter)
    .populate('vehicleId', 'brand model registrationNumber')
    .select('bookingNumber vehicleId status startAt endAt pickupDate returnDate')
    .sort({ startAt: 1 })
    .lean();
}

module.exports = {
  runInTransaction,
  buildPricedAddOns,
  validateRange,
  quoteBooking,
  createBooking,
  getBookingOrThrow,
  confirmBooking,
  activateBooking,
  completeBooking,
  cancelBooking,
  getCalendar,
};
