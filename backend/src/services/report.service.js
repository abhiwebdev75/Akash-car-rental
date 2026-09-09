/**
 * Reporting service — read-only aggregations for the dashboard and CSV exports.
 * All figures are computed from the database (the source of truth); nothing is
 * accepted from the client beyond the query range/filters.
 */
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');
const { round2 } = require('./pricing.service');
const { BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_KIND, VEHICLE_STATUS } = require('../config/constants');

function toDate(v, fallback) {
  const d = v ? new Date(v) : fallback;
  return Number.isNaN(d.getTime()) ? fallback : d;
}

/** Normalize an optional {from,to} range, defaulting to the last 30 days. */
function normalizeRange({ from, to } = {}) {
  const end = toDate(to, new Date());
  const start = toDate(from, new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000));
  return { start, end };
}

/**
 * Revenue from PAID inflow payments in a range, grouped by day. Uses the payment
 * ledger (actual money received), not booking totals.
 */
async function revenueReport({ from, to, locationId } = {}) {
  const { start, end } = normalizeRange({ from, to });

  const bookingMatch = {};
  if (locationId) bookingMatch.locationId = new (require('mongoose').Types.ObjectId)(String(locationId));

  const rows = await Payment.aggregate([
    {
      $match: {
        status: PAYMENT_STATUS.PAID,
        kind: { $in: [PAYMENT_KIND.RENTAL, PAYMENT_KIND.EXTRA_CHARGES] },
        paidAt: { $gte: start, $lte: end },
      },
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking',
      },
    },
    { $unwind: '$booking' },
    ...(locationId ? [{ $match: { 'booking.locationId': bookingMatch.locationId } }] : []),
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
        revenue: { $sum: '$amount' },
        payments: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalRevenue = round2(rows.reduce((s, r) => s + r.revenue, 0));
  return {
    range: { from: start, to: end },
    totalRevenue,
    byDay: rows.map((r) => ({ date: r._id, revenue: round2(r.revenue), payments: r.payments })),
  };
}

/** Booking counts by status in a range (by booking creation date). */
async function bookingsReport({ from, to, locationId } = {}) {
  const { start, end } = normalizeRange({ from, to });
  const match = { createdAt: { $gte: start, $lte: end } };
  if (locationId) match.locationId = new (require('mongoose').Types.ObjectId)(String(locationId));

  const rows = await Booking.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
  ]);

  const byStatus = {};
  let total = 0;
  rows.forEach((r) => {
    byStatus[r._id] = { count: r.count, value: round2(r.value) };
    total += r.count;
  });
  return { range: { from: start, to: end }, total, byStatus };
}

/**
 * Fleet utilization: for each vehicle, the number of rental days booked in the
 * range vs the range length. Utilization = bookedDays / rangeDays.
 */
async function fleetUtilization({ from, to, locationId } = {}) {
  const { start, end } = normalizeRange({ from, to });
  const rangeMs = Math.max(1, end.getTime() - start.getTime());
  const rangeDays = rangeMs / (24 * 60 * 60 * 1000);

  const vehicleFilter = { status: { $ne: VEHICLE_STATUS.INACTIVE } };
  if (locationId) vehicleFilter.locationId = locationId;
  const vehicles = await Vehicle.find(vehicleFilter).select('brand model registrationNumber').lean();

  const bookings = await Booking.find({
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.COMPLETED] },
    startAt: { $lt: end },
    endAt: { $gt: start },
    ...(locationId ? { locationId } : {}),
  })
    .select('vehicleId startAt endAt')
    .lean();

  const bookedMsByVehicle = new Map();
  bookings.forEach((b) => {
    const s = Math.max(b.startAt.getTime(), start.getTime());
    const e = Math.min(b.endAt.getTime(), end.getTime());
    const ms = Math.max(0, e - s);
    const key = String(b.vehicleId);
    bookedMsByVehicle.set(key, (bookedMsByVehicle.get(key) || 0) + ms);
  });

  const perVehicle = vehicles.map((v) => {
    const bookedDays = (bookedMsByVehicle.get(String(v._id)) || 0) / (24 * 60 * 60 * 1000);
    return {
      vehicleId: v._id,
      vehicle: [v.brand, v.model].filter(Boolean).join(' '),
      registrationNumber: v.registrationNumber,
      bookedDays: round2(bookedDays),
      utilization: round2(Math.min(1, bookedDays / rangeDays)),
    };
  });

  const avg = perVehicle.length
    ? round2(perVehicle.reduce((s, r) => s + r.utilization, 0) / perVehicle.length)
    : 0;
  return { range: { from: start, to: end }, rangeDays: round2(rangeDays), averageUtilization: avg, perVehicle };
}

/** Bookings with an outstanding rental balance. */
async function outstandingPayments({ locationId } = {}) {
  const match = {
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.COMPLETED] },
    paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL] },
  };
  if (locationId) match.locationId = locationId;

  const bookings = await Booking.find(match)
    .populate('customerId', 'name phone email')
    .select('bookingNumber customerId totalAmount amountPaid paymentStatus createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const rows = bookings.map((b) => ({
    bookingNumber: b.bookingNumber,
    customer: b.customerId?.name,
    phone: b.customerId?.phone,
    totalAmount: b.totalAmount,
    amountPaid: b.amountPaid,
    outstanding: round2(Math.max(0, (b.totalAmount || 0) - (b.amountPaid || 0))),
    paymentStatus: b.paymentStatus,
  }));
  const totalOutstanding = round2(rows.reduce((s, r) => s + r.outstanding, 0));
  return { totalOutstanding, count: rows.length, rows };
}

// ── CSV export ──────────────────────────────────────────────────────────────

/** Escape a single CSV field per RFC 4180. */
function csvField(value) {
  if (value == null) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Turn an array of plain objects into a CSV string using `columns` order. */
function toCSV(rows, columns) {
  const cols = columns || (rows[0] ? Object.keys(rows[0]) : []);
  const header = cols.map(csvField).join(',');
  const body = rows.map((r) => cols.map((c) => csvField(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

module.exports = {
  normalizeRange,
  revenueReport,
  bookingsReport,
  fleetUtilization,
  outstandingPayments,
  toCSV,
  csvField,
};
