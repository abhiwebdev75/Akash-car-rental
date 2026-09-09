/**
 * Maintenance service — schedules and tracks vehicle maintenance. Scheduling is
 * rejected if it would collide with an existing blocking booking, since a
 * vehicle under maintenance must not be bookable for that window. Starting
 * maintenance flips the vehicle's status snapshot to MAINTENANCE; completing it
 * restores AVAILABLE (unless the vehicle is otherwise occupied).
 */
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const {
  MAINTENANCE_STATUS,
  BLOCKING_BOOKING_STATUSES,
  VEHICLE_STATUS,
} = require('../config/constants');

/** Ensure no blocking booking overlaps the proposed maintenance window. */
async function assertNoBookingConflict(vehicleId, start, end, { excludeId } = {}) {
  if (!start || !end) return;
  const conflict = await Booking.findOne({
    vehicleId,
    status: { $in: [...BLOCKING_BOOKING_STATUSES] },
    startAt: { $lt: new Date(end) },
    endAt: { $gt: new Date(start) },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select('bookingNumber');
  if (conflict) {
    throw ApiError.conflict(
      `A booking (${conflict.bookingNumber}) overlaps this maintenance window`
    );
  }
}

async function scheduleMaintenance(input) {
  const { vehicleId, type, description, scheduledStart, scheduledEnd, vendor, cost, notes, performedBy } = input;
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  if (scheduledStart && scheduledEnd && new Date(scheduledStart) >= new Date(scheduledEnd)) {
    throw ApiError.badRequest('Maintenance end must be after its start');
  }
  await assertNoBookingConflict(vehicleId, scheduledStart, scheduledEnd);

  return Maintenance.create({
    vehicleId,
    type,
    description,
    scheduledStart,
    scheduledEnd,
    vendor,
    cost,
    notes,
    performedBy,
    status: MAINTENANCE_STATUS.SCHEDULED,
  });
}

/** Mark maintenance in progress and reflect it on the vehicle status snapshot. */
async function startMaintenance(id) {
  const m = await Maintenance.findById(id);
  if (!m) throw ApiError.notFound('Maintenance record not found');
  if (m.status === MAINTENANCE_STATUS.COMPLETED) throw ApiError.unprocessable('Already completed');
  m.status = MAINTENANCE_STATUS.IN_PROGRESS;
  await m.save();
  await Vehicle.updateOne({ _id: m.vehicleId }, { status: VEHICLE_STATUS.MAINTENANCE });
  return m;
}

/** Complete maintenance; free the vehicle and update service milestones. */
async function completeMaintenance(id, { cost, odometerAtService, notes } = {}) {
  const m = await Maintenance.findById(id);
  if (!m) throw ApiError.notFound('Maintenance record not found');
  m.status = MAINTENANCE_STATUS.COMPLETED;
  m.completedAt = new Date();
  if (cost != null) m.cost = cost;
  if (odometerAtService != null) m.odometerAtService = odometerAtService;
  if (notes) m.notes = notes;
  await m.save();

  const update = { lastServiceDate: new Date() };
  if (odometerAtService != null) update.currentMileage = odometerAtService;
  // Only restore availability if the vehicle isn't currently rented.
  const vehicle = await Vehicle.findById(m.vehicleId);
  if (vehicle && vehicle.status === VEHICLE_STATUS.MAINTENANCE) {
    update.status = VEHICLE_STATUS.AVAILABLE;
  }
  await Vehicle.updateOne({ _id: m.vehicleId }, update);
  return m;
}

async function cancelMaintenance(id) {
  const m = await Maintenance.findById(id);
  if (!m) throw ApiError.notFound('Maintenance record not found');
  if (m.status === MAINTENANCE_STATUS.COMPLETED) throw ApiError.unprocessable('Already completed');
  m.status = MAINTENANCE_STATUS.CANCELLED;
  await m.save();
  const vehicle = await Vehicle.findById(m.vehicleId);
  if (vehicle && vehicle.status === VEHICLE_STATUS.MAINTENANCE) {
    await Vehicle.updateOne({ _id: m.vehicleId }, { status: VEHICLE_STATUS.AVAILABLE });
  }
  return m;
}

async function listMaintenance({ vehicleId, status } = {}) {
  const filter = {};
  if (vehicleId) filter.vehicleId = vehicleId;
  if (status) filter.status = status;
  return Maintenance.find(filter)
    .populate('vehicleId', 'brand model registrationNumber')
    .sort({ scheduledStart: -1, createdAt: -1 })
    .lean();
}

module.exports = {
  assertNoBookingConflict,
  scheduleMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
  listMaintenance,
};
