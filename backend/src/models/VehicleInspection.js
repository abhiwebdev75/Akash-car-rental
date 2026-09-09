/**
 * VehicleInspection model. Records the condition of a vehicle at PICKUP and at
 * RETURN, including categorized photos and (optionally) the customer's
 * confirmation/signature. A booking has at most one PICKUP and one RETURN
 * inspection (enforced by a unique compound index).
 */
const { Schema, model } = require('mongoose');
const {
  INSPECTION_TYPE,
  CONDITION,
  PHOTO_CATEGORY,
  enumValues,
} = require('../config/constants');

const inspectionPhotoSchema = new Schema(
  {
    category: { type: String, enum: enumValues(PHOTO_CATEGORY), required: true },
    url: { type: String, required: true },
    publicId: String,
  },
  { _id: false }
);

const inspectionSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    type: { type: String, enum: enumValues(INSPECTION_TYPE), required: true },
    odometer: { type: Number, required: true, min: 0 },
    fuelLevel: { type: Number, min: 0, max: 100 }, // percentage
    exteriorCondition: { type: String, enum: enumValues(CONDITION) },
    interiorCondition: { type: String, enum: enumValues(CONDITION) },
    tyreCondition: { type: String, enum: enumValues(CONDITION) },
    existingDamage: String,
    notes: String,
    photos: { type: [inspectionPhotoSchema], default: [] },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedAt: { type: Date, default: Date.now },
    customerConfirmed: { type: Boolean, default: false },
    customerSignature: String, // stored reference / data-url
  },
  { timestamps: true }
);

// One inspection of each type per booking.
inspectionSchema.index({ bookingId: 1, type: 1 }, { unique: true });

module.exports = model('VehicleInspection', inspectionSchema);
