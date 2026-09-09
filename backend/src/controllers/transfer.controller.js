/**
 * Vehicle transfer controller. Managers/owners move vehicles between locations.
 * The service keeps Vehicle.locationId (the source of truth) accurate and
 * refuses to strand active/upcoming bookings.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const transferService = require('../services/transfer.service');

const create = asyncHandler(async (req, res) => {
  const transfer = await transferService.createTransfer({
    ...req.body,
    requestedBy: req.user._id,
  });
  return sendCreated(res, transfer, { message: 'Transfer recorded' });
});

const complete = asyncHandler(async (req, res) => {
  const transfer = await transferService.completeTransfer(req.params.id);
  return sendSuccess(res, transfer, { message: 'Transfer completed' });
});

const cancel = asyncHandler(async (req, res) => {
  const transfer = await transferService.cancelTransfer(req.params.id);
  return sendSuccess(res, transfer, { message: 'Transfer cancelled' });
});

const list = asyncHandler(async (req, res) => {
  const transfers = await transferService.listTransfers({
    vehicleId: req.query.vehicleId,
    locationId: req.query.locationId,
  });
  return sendSuccess(res, transfers);
});

module.exports = { create, complete, cancel, list };
