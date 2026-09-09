/**
 * Vehicle model. `locationId` is the single source of truth for a vehicle's
 * *current* location. `status` is a current-state snapshot for the dashboard;
 * date-range availability is decided by actual Bookings + Maintenance windows,
 * not by this field.
 */
const { Schema, model } = require('mongoose');
const {
  VEHICLE_STATUS,
  VEHICLE_TYPE,
  TRANSMISSION,
  FUEL_TYPE,
  enumValues,
} = require('../config/constants');

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const vehicleSchema = new Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    variant: { type: String, trim: true },
    year: { type: Number, min: 1980, max: 2100 },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicleType: { type: String, enum: enumValues(VEHICLE_TYPE), required: true, index: true },
    transmission: { type: String, enum: enumValues(TRANSMISSION), required: true },
    fuelType: { type: String, enum: enumValues(FUEL_TYPE), required: true },
    seats: { type: Number, required: true, min: 1, max: 60 },
    luggageCapacity: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    features: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] },

    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    status: {
      type: String,
      enum: enumValues(VEHICLE_STATUS),
      default: VEHICLE_STATUS.AVAILABLE,
      index: true,
    },

    // Pricing
    dailyPrice: { type: Number, required: true, min: 0 },
    weeklyPrice: { type: Number, min: 0 }, // optional tier
    monthlyPrice: { type: Number, min: 0 }, // optional tier
    securityDeposit: { type: Number, default: 0, min: 0 },
    extraKmPrice: { type: Number, default: 0, min: 0 },
    kmPerDayAllowance: { type: Number, default: 0, min: 0 }, // 0 => unlimited

    // Maintenance-relevant fields
    currentMileage: { type: Number, default: 0, min: 0 },
    nextServiceMileage: { type: Number, min: 0 },
    lastServiceDate: Date,
    insuranceExpiry: Date,
    pucExpiry: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index powering the availability query (location + status filters).
vehicleSchema.index({ locationId: 1, status: 1 });
vehicleSchema.index({ dailyPrice: 1 });

vehicleSchema.virtual('title').get(function title() {
  return [this.brand, this.model, this.variant].filter(Boolean).join(' ');
});

vehicleSchema.virtual('primaryImage').get(function primaryImage() {
  if (!this.images || !this.images.length) return null;
  return (this.images.find((i) => i.isPrimary) || this.images[0]).url;
});

module.exports = model('Vehicle', vehicleSchema);
