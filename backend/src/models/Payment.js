/**
 * Payment model. Records every money movement against a booking (rental,
 * deposit, deposit refund, extra charges, refund). The `provider` field plus the
 * payment service abstraction means an online gateway can be added later without
 * touching booking logic.
 */
const { Schema, model } = require('mongoose');
const {
  PAYMENT_STATUS,
  PAYMENT_KIND,
  PAYMENT_METHOD,
  enumValues,
} = require('../config/constants');

const paymentSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    kind: {
      type: String,
      enum: enumValues(PAYMENT_KIND),
      default: PAYMENT_KIND.RENTAL,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: enumValues(PAYMENT_METHOD),
      default: PAYMENT_METHOD.CASH,
    },
    status: {
      type: String,
      enum: enumValues(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PAID,
      index: true,
    },
    provider: { type: String, default: 'manual' }, // manual | razorpay | stripe ...
    transactionRef: String,
    paidAt: { type: Date, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

module.exports = model('Payment', paymentSchema);
