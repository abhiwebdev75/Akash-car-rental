/**
 * Location model — a first-class entity. Locations are created/managed by the
 * owner (never hardcoded) and scope vehicles, bookings, and staff.
 */
const { Schema, model } = require('mongoose');
const { LOCATION_STATUS, enumValues } = require('../config/constants');

const locationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    phone: { type: String, trim: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: enumValues(LOCATION_STATUS),
      default: LOCATION_STATUS.ACTIVE,
      index: true,
    },
    geo: { lat: Number, lng: Number }, // future maps support
  },
  { timestamps: true }
);

module.exports = model('Location', locationSchema);
