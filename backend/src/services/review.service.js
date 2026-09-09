/**
 * Review service — a customer may review a vehicle only for their own COMPLETED
 * booking, and only once per booking. Vehicle rating aggregates are computed on
 * demand (the Vehicle document doesn't store denormalized ratings).
 */
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { BOOKING_STATUS, REVIEW_STATUS } = require('../config/constants');

async function createReview({ customerId, bookingId, rating, review = '' }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== String(customerId)) {
    throw ApiError.forbidden('You can only review your own bookings');
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.unprocessable('You can review only after the rental is completed');
  }
  const existing = await Review.findOne({ bookingId });
  if (existing) throw ApiError.conflict('You have already reviewed this booking');

  try {
    return await Review.create({
      customerId,
      vehicleId: booking.vehicleId,
      bookingId,
      rating,
      review,
    });
  } catch (err) {
    if (err && err.code === 11000) throw ApiError.conflict('You have already reviewed this booking');
    throw err;
  }
}

/** Aggregate average rating + count for a vehicle (visible reviews only). */
async function getVehicleRating(vehicleId) {
  const rows = await Review.aggregate([
    {
      $match: {
        vehicleId: new mongoose.Types.ObjectId(String(vehicleId)),
        status: REVIEW_STATUS.VISIBLE,
      },
    },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const r = rows[0];
  return { average: r ? Math.round(r.average * 10) / 10 : 0, count: r ? r.count : 0 };
}

async function listForVehicle(vehicleId, { includeHidden = false } = {}) {
  const filter = { vehicleId };
  if (!includeHidden) filter.status = REVIEW_STATUS.VISIBLE;
  return Review.find(filter).populate('customerId', 'name').sort({ createdAt: -1 }).lean();
}

async function setVisibility(id, status) {
  const r = await Review.findByIdAndUpdate(id, { status }, { new: true });
  if (!r) throw ApiError.notFound('Review not found');
  return r;
}

async function setFeatured(id, featured) {
  const r = await Review.findByIdAndUpdate(id, { featured: Boolean(featured) }, { new: true });
  if (!r) throw ApiError.notFound('Review not found');
  return r;
}

module.exports = {
  createReview,
  getVehicleRating,
  listForVehicle,
  setVisibility,
  setFeatured,
};
