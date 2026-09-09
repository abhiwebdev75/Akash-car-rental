/**
 * Damage model. Tracks damage found on a vehicle, optionally tied to the booking
 * during which it occurred, through its lifecycle from REPORTED to RESOLVED.
 */
const { Schema, model } = require('mongoose');
const { DAMAGE_SEVERITY, DAMAGE_STATUS, enumValues } = require('../config/constants');

const damageSchema = new Schema(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    type: String, // scratch, dent, glass, mechanical ...
    description: String,
    severity: { type: String, enum: enumValues(DAMAGE_SEVERITY), default: DAMAGE_SEVERITY.MINOR },
    photos: { type: [{ url: String, publicId: String }], default: [] },
    estimatedCost: { type: Number, default: 0, min: 0 },
    finalCost: { type: Number, min: 0 },
    status: {
      type: String,
      enum: enumValues(DAMAGE_STATUS),
      default: DAMAGE_STATUS.REPORTED,
      index: true,
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reportedAt: { type: Date, default: Date.now },
    resolvedAt: Date,
  },
  { timestamps: true }
);

module.exports = model('Damage', damageSchema);
