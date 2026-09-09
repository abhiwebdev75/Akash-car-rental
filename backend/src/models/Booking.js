/**
 * Booking model. `startAt`/`endAt` are the canonical UTC instants used by the
 * availability engine; they are derived from pickup/return date + time by a
 * pre-validate hook (and also set explicitly by the booking service before the
 * conflict check). Money fields are stored so historical bookings remain
 * accurate even if vehicle prices or tax rates change later.
 */
const { Schema, model } = require('mongoose');
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  ADDON_PRICING_TYPE,
  enumValues,
} = require('../config/constants');
const { combineDateTime } = require('../utils/dates');

const bookingAddOnSchema = new Schema(
  {
    addOnId: { type: Schema.Types.ObjectId, ref: 'AddOn' },
    name: String,
    pricingType: { type: String, enum: enumValues(ADDON_PRICING_TYPE) },
    unitPrice: Number,
    quantity: { type: Number, default: 1 },
    lineTotal: Number,
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    // Defaults to pickup location; present so one-way rentals can be added later.
    returnLocationId: { type: Schema.Types.ObjectId, ref: 'Location' },

    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    pickupTime: { type: String, default: '10:00' },
    returnTime: { type: String, default: '10:00' },

    // Canonical instants for overlap math.
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },

    status: {
      type: String,
      enum: enumValues(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },

    addOns: { type: [bookingAddOnSchema], default: [] },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },

    pricingBreakdown: {
      days: Number,
      baseStrategy: String, // "DAILY" | "TIERED"
      base: Number,
      addOnsTotal: Number,
      subtotal: Number,
    },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0 }, // snapshot
    securityDeposit: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    amountPaid: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: enumValues(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    specialRequests: { type: String, default: '' },

    cancellation: {
      at: Date,
      by: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      refundAmount: Number,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Availability query index: find blocking bookings for a vehicle in a range.
bookingSchema.index({ vehicleId: 1, status: 1, startAt: 1, endAt: 1 });
bookingSchema.index({ startAt: 1, endAt: 1 });

// Derive canonical instants and default return location before validation.
bookingSchema.pre('validate', function deriveFields(next) {
  try {
    if (this.pickupDate && !this.startAt) {
      this.startAt = combineDateTime(this.pickupDate, this.pickupTime);
    }
    if (this.returnDate && !this.endAt) {
      this.endAt = combineDateTime(this.returnDate, this.returnTime);
    }
    if (!this.returnLocationId) this.returnLocationId = this.locationId;
    next();
  } catch (err) {
    next(err);
  }
});

bookingSchema.virtual('amountRemaining').get(function amountRemaining() {
  return Math.max(0, (this.totalAmount || 0) - (this.amountPaid || 0));
});

module.exports = model('Booking', bookingSchema);
