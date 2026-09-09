/**
 * Emergency service — a customer raises an assistance request during an ACTIVE
 * booking (breakdown, flat tyre, accident, etc.). Admins/staff are notified and
 * handle it through to resolution. Customers may only raise requests against
 * their own booking.
 */
const EmergencyRequest = require('../models/EmergencyRequest');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');
const { EMERGENCY_STATUS, BOOKING_STATUS } = require('../config/constants');

/**
 * Create an emergency request. `customerId` is the authenticated customer (the
 * controller passes it); the booking must belong to them. Staff may also raise
 * one on a customer's behalf (the controller decides who customerId is).
 */
async function createEmergency(input) {
  const { bookingId, customerId, type, description, location, phone, photos = [], raisedByStaff } = input;

  const booking = await Booking.findById(bookingId).select('customerId vehicleId status');
  if (!booking) throw ApiError.notFound('Booking not found');

  if (!raisedByStaff && String(booking.customerId) !== String(customerId)) {
    throw ApiError.forbidden('You can only raise an emergency for your own booking');
  }
  if (![BOOKING_STATUS.ACTIVE, BOOKING_STATUS.CONFIRMED].includes(booking.status)) {
    throw ApiError.unprocessable('Emergencies can only be raised for a confirmed or active booking');
  }

  const request = await EmergencyRequest.create({
    bookingId,
    customerId: booking.customerId,
    vehicleId: booking.vehicleId,
    type,
    description,
    location,
    phone,
    photos,
    status: EMERGENCY_STATUS.OPEN,
  });

  notificationService.onEmergency(request).catch((err) =>
    logger.warn({ err }, 'onEmergency notification failed')
  );
  return request;
}

async function getById(id) {
  const request = await EmergencyRequest.findById(id)
    .populate('customerId', 'name phone')
    .populate('vehicleId', 'brand model registrationNumber')
    .populate('handledBy', 'name role');
  if (!request) throw ApiError.notFound('Emergency request not found');
  return request;
}

/** Move an emergency to ACKNOWLEDGED/RESOLVED/CANCELLED and record the handler. */
async function updateStatus(id, status, handledBy) {
  const request = await EmergencyRequest.findById(id);
  if (!request) throw ApiError.notFound('Emergency request not found');
  request.status = status;
  if (handledBy) request.handledBy = handledBy;
  await request.save();
  return request;
}

async function listEmergencies({ status, bookingId, customerId } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (bookingId) filter.bookingId = bookingId;
  if (customerId) filter.customerId = customerId;
  return EmergencyRequest.find(filter)
    .populate('customerId', 'name phone')
    .populate('vehicleId', 'brand model registrationNumber')
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = { createEmergency, getById, updateStatus, listEmergencies };
