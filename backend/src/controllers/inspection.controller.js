/**
 * Inspection controller. Staff record PICKUP and RETURN inspections; on RETURN
 * the service returns the computed extra-charge breakdown (extra km, late fee,
 * fuel) which the frontend can then turn into a payment.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const inspectionService = require('../services/inspection.service');

const create = asyncHandler(async (req, res) => {
  const result = await inspectionService.createInspection({ ...req.body, performedBy: req.user._id });
  return sendCreated(res, result, { message: `${req.body.type} inspection recorded` });
});

const getByBooking = asyncHandler(async (req, res) => {
  const data = await inspectionService.getByBooking(req.params.bookingId);
  return sendSuccess(res, data);
});

module.exports = { create, getByBooking };
