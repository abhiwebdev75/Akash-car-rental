/**
 * Payment controller. Recording payments is available to any staff member
 * (counter staff take cash/card at pickup); refunds are restricted to finance
 * roles. All balance math is done by the payment service.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const paymentService = require('../services/payment.service');

const record = asyncHandler(async (req, res) => {
  const result = await paymentService.recordPayment({ ...req.body, recordedBy: req.user._id });
  return sendCreated(res, result, { message: 'Payment recorded' });
});

const refund = asyncHandler(async (req, res) => {
  const result = await paymentService.refundPayment({ ...req.body, recordedBy: req.user._id });
  return sendCreated(res, result, { message: 'Refund recorded' });
});

const listByBooking = asyncHandler(async (req, res) => {
  const payments = await paymentService.listByBooking(req.params.bookingId);
  return sendSuccess(res, payments);
});

const balance = asyncHandler(async (req, res) => {
  const data = await paymentService.getBalance(req.params.bookingId);
  return sendSuccess(res, data);
});

module.exports = { record, refund, listByBooking, balance };
