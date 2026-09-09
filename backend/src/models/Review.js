/**
 * Review model. A customer may review a vehicle only for a completed rental, and
 * only once per booking (enforced by a unique index on bookingId). Admins can
 * hide or feature reviews.
 */
const { Schema, model } = require('mongoose');
const { REVIEW_STATUS, enumValues } = require('../config/constants');

const reviewSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: '' },
    status: {
      type: String,
      enum: enumValues(REVIEW_STATUS),
      default: REVIEW_STATUS.VISIBLE,
      index: true,
    },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('Review', reviewSchema);
