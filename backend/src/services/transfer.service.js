/**
 * Vehicle transfer service — moves a vehicle between locations while keeping
 * Vehicle.locationId (the single source of truth for current location) accurate.
 * A vehicle cannot be transferred while it is out on an active rental, and a
 * transfer is rejected if bookings already exist at the origin during transit.
 */
const mongoose = require('mongoose');
const VehicleTransfer = require('../models/VehicleTransfer');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Location = require('../models/Location');
const ApiError = require('../utils/ApiError');
const { BOOKING_STATUS, TRANSFER_STATUS, VEHICLE_STATUS } = require('../config/constants');

/**
 * Create a transfer. By default it completes immediately (updates the vehicle's
 * location atomically). Pass `complete:false` to record an in-transit move that
 * is finalized later via `completeTransfer`.
 */
async function createTransfer({ vehicleId, toLocationId, reason, requestedBy, complete = true }) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  if (String(vehicle.locationId) === String(toLocationId)) {
    throw ApiError.badRequest('Vehicle is already at that location');
  }
  const dest = await Location.findById(toLocationId);
  if (!dest) throw ApiError.notFound('Destination location not found');

  if (vehicle.status === VEHICLE_STATUS.RENTED) {
    throw ApiError.conflict('Vehicle is currently rented and cannot be transferred');
  }

  // Reject if the vehicle has upcoming bookings at its current location that
  // would be stranded by the move.
  const upcoming = await Booking.countDocuments({
    vehicleId,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE] },
    endAt: { $gt: new Date() },
  });
  if (upcoming > 0) {
    throw ApiError.conflict(
      'Vehicle has upcoming confirmed/active bookings; resolve them before transferring'
    );
  }

  const fromLocationId = vehicle.locationId;
  const session = await mongoose.startSession();
  let transfer;
  try {
    const run = async (s) => {
      const [created] = await VehicleTransfer.create(
        [
          {
            vehicleId,
            fromLocationId,
            toLocationId,
            reason,
            requestedBy,
            status: complete ? TRANSFER_STATUS.COMPLETED : TRANSFER_STATUS.IN_TRANSIT,
            transferDate: new Date(),
            completedAt: complete ? new Date() : undefined,
          },
        ],
        { session: s || undefined }
      );
      transfer = created;
      if (complete) {
        await Vehicle.updateOne({ _id: vehicleId }, { locationId: toLocationId }, { session: s || undefined });
      }
    };
    try {
      await session.withTransaction((s) => run(s));
    } catch (err) {
      if (err?.code === 20 || /replica set|does not support transactions/i.test(String(err?.message))) {
        await run(null);
      } else throw err;
    }
  } finally {
    session.endSession();
  }
  return transfer;
}

/** Finalize an in-transit transfer: update the vehicle's current location. */
async function completeTransfer(transferId) {
  const transfer = await VehicleTransfer.findById(transferId);
  if (!transfer) throw ApiError.notFound('Transfer not found');
  if (transfer.status === TRANSFER_STATUS.COMPLETED) return transfer;
  if (transfer.status === TRANSFER_STATUS.CANCELLED) {
    throw ApiError.unprocessable('Transfer was cancelled');
  }
  transfer.status = TRANSFER_STATUS.COMPLETED;
  transfer.completedAt = new Date();
  await transfer.save();
  await Vehicle.updateOne({ _id: transfer.vehicleId }, { locationId: transfer.toLocationId });
  return transfer;
}

async function cancelTransfer(transferId) {
  const transfer = await VehicleTransfer.findById(transferId);
  if (!transfer) throw ApiError.notFound('Transfer not found');
  if (transfer.status === TRANSFER_STATUS.COMPLETED) {
    throw ApiError.unprocessable('Completed transfers cannot be cancelled');
  }
  transfer.status = TRANSFER_STATUS.CANCELLED;
  await transfer.save();
  return transfer;
}

async function listTransfers({ vehicleId, locationId } = {}) {
  const filter = {};
  if (vehicleId) filter.vehicleId = vehicleId;
  if (locationId) filter.$or = [{ fromLocationId: locationId }, { toLocationId: locationId }];
  return VehicleTransfer.find(filter)
    .populate('vehicleId', 'brand model registrationNumber')
    .populate('fromLocationId toLocationId', 'name code city')
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = { createTransfer, completeTransfer, cancelTransfer, listTransfers };
