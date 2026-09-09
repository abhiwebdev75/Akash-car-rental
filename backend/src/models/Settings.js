/**
 * Business settings — a single configuration document. Replaces hardcoded
 * business data (name, contact, tax rate, policies, booking rules) so the owner
 * can configure everything from the dashboard.
 */
const { Schema, model } = require('mongoose');
const { BLOCKING_BOOKING_STATUSES } = require('../config/constants');

const settingsSchema = new Schema(
  {
    // Fixed key so there is only ever one settings document.
    key: { type: String, default: 'business', unique: true, immutable: true },

    businessName: { type: String, default: 'Car Rental Co.' },
    logo: { url: String, publicId: String },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    address: { type: String, default: '' },

    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 0.18, min: 0, max: 1 }, // fraction, e.g. 0.18 = 18%

    policies: {
      terms: { type: String, default: '' },
      cancellation: { type: String, default: '' },
      fuel: { type: String, default: 'Return the vehicle with the same fuel level as pickup.' },
      mileage: { type: String, default: '' },
    },

    booking: {
      // Minutes of separation required between two bookings of the same vehicle.
      // 0 => same-day turnover allowed (touching endpoints are fine).
      turnoverBufferMinutes: { type: Number, default: 0, min: 0 },
      // Booking statuses that hold a vehicle and therefore block availability.
      blockingStatuses: { type: [String], default: () => [...BLOCKING_BOOKING_STATUSES] },
      minRentalHours: { type: Number, default: 4, min: 1 },
      cancellationWindowHours: { type: Number, default: 24, min: 0 },
    },

    charges: {
      lateFeePerHour: { type: Number, default: 200, min: 0 },
      fuelChargePerUnit: { type: Number, default: 100, min: 0 }, // per % / eighth below pickup
    },
  },
  { timestamps: true }
);

/** Fetch the singleton settings document, creating defaults on first access. */
settingsSchema.statics.getSettings = async function getSettings() {
  let doc = await this.findOne({ key: 'business' });
  if (!doc) doc = await this.create({ key: 'business' });
  return doc;
};

module.exports = model('Settings', settingsSchema);
