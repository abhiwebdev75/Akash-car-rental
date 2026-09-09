/**
 * Damage service — records damage found on a vehicle (optionally tied to the
 * booking during which it occurred) and moves it through its lifecycle. Admins
 * are notified when damage is reported. Photos are passed as already-uploaded
 * references ({ url, publicId }) obtained from the /api/uploads endpoint.
 */
const Damage = require('../models/Damage');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');
const { DAMAGE_STATUS } = require('../config/constants');

async function reportDamage(input) {
  const {
    vehicleId,
    bookingId,
    type,
    description,
    severity,
    photos = [],
    estimatedCost,
    reportedBy,
  } = input;

  const vehicle = await Vehicle.findById(vehicleId).select('_id');
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (bookingId) {
    const booking = await Booking.findById(bookingId).select('_id vehicleId');
    if (!booking) throw ApiError.notFound('Booking not found');
  }

  const damage = await Damage.create({
    vehicleId,
    bookingId,
    type,
    description,
    severity,
    photos,
    estimatedCost,
    reportedBy,
    status: DAMAGE_STATUS.REPORTED,
  });

  // Best-effort: never let a notification failure break damage reporting.
  notificationService.onDamageReported(damage).catch((err) =>
    logger.warn({ err }, 'onDamageReported notification failed')
  );
  return damage;
}

async function getById(id) {
  const damage = await Damage.findById(id)
    .populate('vehicleId', 'brand model registrationNumber')
    .populate('reportedBy', 'name role');
  if (!damage) throw ApiError.notFound('Damage record not found');
  return damage;
}

/** Update status and/or costs; sets resolvedAt when moving to RESOLVED. */
async function updateDamage(id, { status, estimatedCost, finalCost, description } = {}) {
  const damage = await Damage.findById(id);
  if (!damage) throw ApiError.notFound('Damage record not found');

  if (status) {
    damage.status = status;
    damage.resolvedAt = status === DAMAGE_STATUS.RESOLVED ? new Date() : undefined;
  }
  if (estimatedCost != null) damage.estimatedCost = estimatedCost;
  if (finalCost != null) damage.finalCost = finalCost;
  if (description != null) damage.description = description;
  await damage.save();
  return damage;
}

async function listDamages({ vehicleId, bookingId, status } = {}) {
  const filter = {};
  if (vehicleId) filter.vehicleId = vehicleId;
  if (bookingId) filter.bookingId = bookingId;
  if (status) filter.status = status;
  return Damage.find(filter)
    .populate('vehicleId', 'brand model registrationNumber')
    .sort({ reportedAt: -1, createdAt: -1 })
    .lean();
}

module.exports = { reportDamage, getById, updateDamage, listDamages };
