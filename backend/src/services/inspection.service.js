/**
 * Inspection service — records PICKUP and RETURN vehicle inspections and, at
 * return, computes any extra charges (extra kilometres, late return, fuel
 * shortfall) using the trusted pricing engine. Charges are computed here on the
 * backend from the recorded odometer/fuel values, never trusted from the client.
 */
const VehicleInspection = require('../models/VehicleInspection');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Settings = require('../models/Settings');
const pricing = require('./pricing.service');
const ApiError = require('../utils/ApiError');
const { INSPECTION_TYPE } = require('../config/constants');

/** Load a booking (with vehicle) or throw. */
async function loadBookingWithVehicle(bookingId, session = null) {
  const booking = await Booking.findById(bookingId).session(session || null);
  if (!booking) throw ApiError.notFound('Booking not found');
  const vehicle = await Vehicle.findById(booking.vehicleId).session(session || null);
  if (!vehicle) throw ApiError.notFound('Vehicle for booking not found');
  return { booking, vehicle };
}

/**
 * Compute return charges from the pickup baseline and the return readings.
 * Pure aside from reading Settings; returns a full breakdown with a grand total.
 */
async function computeReturnCharges({ booking, vehicle, pickup, returnReadings, actualReturnAt }) {
  const settings = await Settings.getSettings();
  const days = booking.pricingBreakdown?.days || 1;

  const kmDriven = Math.max(0, (returnReadings.odometer || 0) - (pickup?.odometer || 0));
  const extraKm = pricing.computeExtraKmCharge(vehicle, kmDriven, days);
  const late = pricing.computeLateFee(
    booking.endAt,
    actualReturnAt || new Date(),
    settings.charges.lateFeePerHour
  );
  const fuel = pricing.computeFuelCharge(
    pickup?.fuelLevel ?? returnReadings.fuelLevel ?? 0,
    returnReadings.fuelLevel ?? 0,
    settings.charges.fuelChargePerUnit
  );

  const total = pricing.round2(extraKm.charge + late.charge + fuel.charge);
  return {
    kmDriven,
    extraKm,
    lateFee: late,
    fuel,
    total,
    currency: settings.currency,
  };
}

/**
 * Create (or reject duplicate of) an inspection for a booking.
 * For RETURN inspections, the computed extra-charge breakdown is attached to the
 * returned result under `charges` (recording a payment is a separate, explicit
 * step handled by the controller/payment service).
 */
async function createInspection(input) {
  const {
    bookingId,
    type,
    odometer,
    fuelLevel,
    exteriorCondition,
    interiorCondition,
    tyreCondition,
    existingDamage,
    notes,
    photos = [],
    performedBy,
    performedAt,
    customerConfirmed = false,
    customerSignature,
  } = input;

  if (![INSPECTION_TYPE.PICKUP, INSPECTION_TYPE.RETURN].includes(type)) {
    throw ApiError.badRequest('Inspection type must be PICKUP or RETURN');
  }

  const { booking, vehicle } = await loadBookingWithVehicle(bookingId);

  // Guard against duplicates up front for a clean error (the unique index is the
  // ultimate backstop).
  const existing = await VehicleInspection.findOne({ bookingId, type });
  if (existing) throw ApiError.conflict(`A ${type} inspection already exists for this booking`);

  let charges = null;
  if (type === INSPECTION_TYPE.RETURN) {
    const pickup = await VehicleInspection.findOne({ bookingId, type: INSPECTION_TYPE.PICKUP });
    charges = await computeReturnCharges({
      booking,
      vehicle,
      pickup,
      returnReadings: { odometer, fuelLevel },
      actualReturnAt: performedAt ? new Date(performedAt) : new Date(),
    });
  }

  let inspection;
  try {
    inspection = await VehicleInspection.create({
      bookingId,
      vehicleId: booking.vehicleId,
      type,
      odometer,
      fuelLevel,
      exteriorCondition,
      interiorCondition,
      tyreCondition,
      existingDamage,
      notes,
      photos,
      performedBy,
      performedAt: performedAt || new Date(),
      customerConfirmed,
      customerSignature,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      throw ApiError.conflict(`A ${type} inspection already exists for this booking`);
    }
    throw err;
  }

  // Keep the vehicle's odometer current from the latest reading.
  if (odometer != null && odometer > (vehicle.currentMileage || 0)) {
    await Vehicle.findByIdAndUpdate(vehicle._id, { currentMileage: odometer });
  }

  return { inspection, charges };
}

/** Fetch both inspections for a booking. */
async function getByBooking(bookingId) {
  const inspections = await VehicleInspection.find({ bookingId }).sort({ type: 1 }).lean();
  return {
    pickup: inspections.find((i) => i.type === INSPECTION_TYPE.PICKUP) || null,
    return: inspections.find((i) => i.type === INSPECTION_TYPE.RETURN) || null,
  };
}

module.exports = { createInspection, getByBooking, computeReturnCharges };
