/**
 * EmergencyRequest model. Raised by a customer during an ACTIVE booking
 * (breakdown, flat tyre, accident, etc.). Admins/staff receive and handle it.
 */
const { Schema, model } = require('mongoose');
const { EMERGENCY_TYPE, EMERGENCY_STATUS, enumValues } = require('../config/constants');

const emergencySchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    type: { type: String, enum: enumValues(EMERGENCY_TYPE), required: true },
    description: String,
    location: { text: String, lat: Number, lng: Number },
    phone: String,
    photos: { type: [{ url: String, publicId: String }], default: [] },
    status: {
      type: String,
      enum: enumValues(EMERGENCY_STATUS),
      default: EMERGENCY_STATUS.OPEN,
      index: true,
    },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = model('EmergencyRequest', emergencySchema);
