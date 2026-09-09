/**
 * Maintenance model. Records service/repair/insurance/PUC events. Records in a
 * blocking status (SCHEDULED / IN_PROGRESS) with a scheduled window make the
 * vehicle unavailable for bookings that overlap that window.
 */
const { Schema, model } = require('mongoose');
const { MAINTENANCE_TYPE, MAINTENANCE_STATUS, enumValues } = require('../config/constants');

const maintenanceSchema = new Schema(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    type: { type: String, enum: enumValues(MAINTENANCE_TYPE), required: true },
    description: String,
    status: {
      type: String,
      enum: enumValues(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.SCHEDULED,
      index: true,
    },
    scheduledStart: Date,
    scheduledEnd: Date,
    completedAt: Date,
    cost: { type: Number, default: 0, min: 0 },
    odometerAtService: { type: Number, min: 0 },
    vendor: String,
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

// Availability check: overlapping blocking maintenance for a vehicle.
maintenanceSchema.index({ vehicleId: 1, status: 1, scheduledStart: 1, scheduledEnd: 1 });

module.exports = model('Maintenance', maintenanceSchema);
