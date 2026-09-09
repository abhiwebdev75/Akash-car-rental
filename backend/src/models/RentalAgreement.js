/**
 * RentalAgreement model. Generated from a confirmed booking; stores a snapshot
 * of all agreement terms (so the document is stable even if settings/prices
 * change) plus a reference to the generated PDF. One agreement per booking.
 */
const { Schema, model } = require('mongoose');

const agreementSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    agreementNumber: { type: String, required: true, unique: true },
    // Full snapshot captured at generation time (business, customer, vehicle,
    // dates, pricing, and policy text).
    snapshot: { type: Schema.Types.Mixed, default: {} },
    pdf: { url: String, publicId: String },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    generatedAt: { type: Date, default: Date.now },
    customerSigned: { type: Boolean, default: false },
    signedAt: Date,
  },
  { timestamps: true }
);

module.exports = model('RentalAgreement', agreementSchema);
