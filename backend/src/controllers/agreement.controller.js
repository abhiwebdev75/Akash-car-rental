/**
 * Agreement controller. Staff generate/regenerate the rental agreement PDF; the
 * owning customer (or staff) can fetch it and mark it signed.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Booking = require('../models/Booking');
const agreementService = require('../services/agreement.service');
const { ROLES } = require('../config/constants');

/** Ensure a customer only touches agreements for their own bookings. */
async function assertCanAccess(user, bookingId) {
  if (user.role !== ROLES.CUSTOMER) return;
  const booking = await Booking.findById(bookingId).select('customerId');
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== String(user._id)) {
    throw ApiError.forbidden('You can only access your own agreement');
  }
}

const generate = asyncHandler(async (req, res) => {
  const agreement = await agreementService.generateForBooking(req.params.bookingId, {
    regenerate: req.query.regenerate === 'true',
    generatedBy: req.user._id,
  });
  return sendCreated(res, agreement, { message: 'Agreement generated' });
});

const getByBooking = asyncHandler(async (req, res) => {
  await assertCanAccess(req.user, req.params.bookingId);
  const agreement = await agreementService.getByBooking(req.params.bookingId);
  if (!agreement) throw ApiError.notFound('Agreement not found');
  return sendSuccess(res, agreement);
});

const sign = asyncHandler(async (req, res) => {
  await assertCanAccess(req.user, req.params.bookingId);
  const agreement = await agreementService.markSigned(req.params.bookingId);
  return sendSuccess(res, agreement, { message: 'Agreement signed' });
});

module.exports = { generate, getByBooking, sign };
