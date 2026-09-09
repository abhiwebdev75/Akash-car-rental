/**
 * Payment service — records money movements against a booking and keeps the
 * booking's `amountPaid` / `paymentStatus` in sync. The `provider` abstraction
 * leaves room for an online gateway later without changing booking logic.
 *
 * Amounts and payment status are authoritative on the backend.
 */
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const notificationService = require('./notification.service');
const { round2 } = require('./pricing.service');
const ApiError = require('../utils/ApiError');
const { PAYMENT_KIND, PAYMENT_METHOD, PAYMENT_STATUS } = require('../config/constants');

/** Kinds that represent money coming IN from the customer. */
const INFLOW_KINDS = [PAYMENT_KIND.RENTAL, PAYMENT_KIND.DEPOSIT, PAYMENT_KIND.EXTRA_CHARGES];
/** Kinds that represent money going OUT to the customer. */
const OUTFLOW_KINDS = [PAYMENT_KIND.REFUND, PAYMENT_KIND.DEPOSIT_REFUND];

/**
 * Recompute a booking's paid total and payment status from its payment ledger.
 * Only rental-affecting inflows/refunds count toward the rental balance; the
 * refundable deposit is tracked but excluded from the rental "paid" figure.
 */
async function recomputeBookingPayment(bookingId, session = null) {
  const booking = await Booking.findById(bookingId).session(session || null);
  if (!booking) throw ApiError.notFound('Booking not found');

  const payments = await Payment.find({ bookingId, status: PAYMENT_STATUS.PAID })
    .session(session || null)
    .lean();

  // Money applied to the rental balance: rental + extra charges, less refunds.
  const rentalPaid = payments
    .filter((p) => p.kind === PAYMENT_KIND.RENTAL || p.kind === PAYMENT_KIND.EXTRA_CHARGES)
    .reduce((sum, p) => sum + p.amount, 0);
  const refunded = payments
    .filter((p) => p.kind === PAYMENT_KIND.REFUND)
    .reduce((sum, p) => sum + p.amount, 0);

  const amountPaid = round2(Math.max(0, rentalPaid - refunded));
  booking.amountPaid = amountPaid;

  const total = booking.totalAmount || 0;
  if (amountPaid <= 0) booking.paymentStatus = PAYMENT_STATUS.PENDING;
  else if (amountPaid + 0.001 < total) booking.paymentStatus = PAYMENT_STATUS.PARTIAL;
  else booking.paymentStatus = PAYMENT_STATUS.PAID;

  await booking.save({ session: session || undefined });
  return booking;
}

/**
 * Record a payment against a booking and refresh the booking's payment state.
 * @returns {{ payment, booking }}
 */
async function recordPayment({
  bookingId,
  amount,
  kind = PAYMENT_KIND.RENTAL,
  method = PAYMENT_METHOD.CASH,
  provider = 'manual',
  transactionRef,
  notes,
  recordedBy,
}) {
  const amt = round2(Number(amount));
  if (!(amt > 0)) throw ApiError.badRequest('Payment amount must be greater than zero');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  const session = await mongoose.startSession();
  let payment;
  try {
    const runner = async (s) => {
      const [created] = await Payment.create(
        [
          {
            bookingId,
            customerId: booking.customerId,
            amount: amt,
            kind,
            method,
            provider,
            transactionRef,
            notes,
            recordedBy,
            status: PAYMENT_STATUS.PAID,
            paidAt: new Date(),
          },
        ],
        { session: s || undefined }
      );
      payment = created;
      await recomputeBookingPayment(bookingId, s);
    };
    try {
      await session.withTransaction((s) => runner(s));
    } catch (err) {
      const msg = String(err?.message || '');
      if (err?.code === 20 || /replica set|does not support transactions/i.test(msg)) {
        await runner(null);
      } else {
        throw err;
      }
    }
  } finally {
    session.endSession();
  }

  const fresh = await Booking.findById(bookingId);
  if (INFLOW_KINDS.includes(kind)) {
    notificationService.onPaymentReceived(payment, fresh).catch(() => {});
  }
  return { payment, booking: fresh };
}

/** Record a refund (money out). Reduces the booking's paid balance. */
async function refundPayment({ bookingId, amount, kind = PAYMENT_KIND.REFUND, method = PAYMENT_METHOD.CASH, notes, recordedBy }) {
  if (!OUTFLOW_KINDS.includes(kind)) {
    throw ApiError.badRequest('Refund kind must be REFUND or DEPOSIT_REFUND');
  }
  const amt = round2(Number(amount));
  if (!(amt > 0)) throw ApiError.badRequest('Refund amount must be greater than zero');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  const [payment] = await Payment.create([
    {
      bookingId,
      customerId: booking.customerId,
      amount: amt,
      kind,
      method,
      provider: 'manual',
      notes,
      recordedBy,
      status: PAYMENT_STATUS.PAID,
      paidAt: new Date(),
    },
  ]);
  const fresh = await recomputeBookingPayment(bookingId);
  return { payment, booking: fresh };
}

/** List the payment ledger for a booking (newest first). */
async function listByBooking(bookingId) {
  return Payment.find({ bookingId }).sort({ paidAt: -1, createdAt: -1 }).lean();
}

/** Sum of all successful inflows minus refunds for a booking. */
async function getBalance(bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw ApiError.notFound('Booking not found');
  return {
    totalAmount: booking.totalAmount || 0,
    amountPaid: booking.amountPaid || 0,
    amountRemaining: Math.max(0, (booking.totalAmount || 0) - (booking.amountPaid || 0)),
    paymentStatus: booking.paymentStatus,
  };
}

module.exports = {
  recomputeBookingPayment,
  recordPayment,
  refundPayment,
  listByBooking,
  getBalance,
  INFLOW_KINDS,
  OUTFLOW_KINDS,
};
