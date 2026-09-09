/**
 * VehicleTransfer model. Records the movement of a vehicle between locations and
 * maintains transfer history. Completing a transfer updates Vehicle.locationId
 * (done atomically in the vehicle service) so a vehicle's current location is
 * always unambiguous.
 */
const { Schema, model } = require('mongoose');
const { TRANSFER_STATUS, enumValues } = require('../config/constants');

const transferSchema = new Schema(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    fromLocationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    toLocationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    reason: String,
    status: {
      type: String,
      enum: enumValues(TRANSFER_STATUS),
      default: TRANSFER_STATUS.COMPLETED,
      index: true,
    },
    transferDate: { type: Date, default: Date.now },
    completedAt: Date,
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = model('VehicleTransfer', transferSchema);
