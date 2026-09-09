/**
 * Emergency controller. A customer raises assistance for their own booking;
 * staff can also raise one on a customer's behalf and handle the request.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const emergencyService = require('../services/emergency.service');
const { ROLES } = require('../config/constants');

const create = asyncHandler(async (req, res) => {
  const request = await emergencyService.createEmergency({
    ...req.body,
    customerId: req.user._id,
    raisedByStaff: req.user.role !== ROLES.CUSTOMER,
  });
  return sendCreated(res, request, { message: 'Emergency request submitted. Help is on the way.' });
});

const list = asyncHandler(async (req, res) => {
  // Customers only see their own; staff see all (optionally filtered).
  const filter =
    req.user.role === ROLES.CUSTOMER
      ? { customerId: req.user._id }
      : { status: req.query.status, bookingId: req.query.bookingId, customerId: req.query.customerId };
  const requests = await emergencyService.listEmergencies(filter);
  return sendSuccess(res, requests);
});

const getById = asyncHandler(async (req, res) => {
  const request = await emergencyService.getById(req.params.id);
  return sendSuccess(res, request);
});

const updateStatus = asyncHandler(async (req, res) => {
  const request = await emergencyService.updateStatus(req.params.id, req.body.status, req.user._id);
  return sendSuccess(res, request, { message: 'Emergency updated' });
});

module.exports = { create, list, getById, updateStatus };
