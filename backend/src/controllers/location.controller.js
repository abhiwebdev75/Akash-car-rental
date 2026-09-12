/**
 * Location controller. Locations are first-class, owner-managed entities (never
 * hardcoded). Reads are open to any staff member; mutations require manager/owner.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Location = require('../models/Location');
const Vehicle = require('../models/Vehicle');
const { LOCATION_STATUS } = require('../config/constants');

/**
 * Public: active locations for the customer booking widget. Returns only
 * customer-safe fields (no manager/internal data) so the storefront can offer a
 * location dropdown without authentication.
 */
const listPublic = asyncHandler(async (_req, res) => {
  const locations = await Location.find({ status: LOCATION_STATUS.ACTIVE })
    .select('name city state address phone geo')
    .sort({ name: 1 })
    .lean();
  return sendSuccess(res, locations);
});

const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.city) filter.city = req.query.city;
  const locations = await Location.find(filter).populate('manager', 'name email').sort({ name: 1 }).lean();
  return sendSuccess(res, locations);
});

const getById = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id).populate('manager', 'name email');
  if (!location) throw ApiError.notFound('Location not found');
  return sendSuccess(res, location);
});

const create = asyncHandler(async (req, res) => {
  const location = await Location.create(req.body);
  return sendCreated(res, location);
});

const update = asyncHandler(async (req, res) => {
  const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!location) throw ApiError.notFound('Location not found');
  return sendSuccess(res, location);
});

const remove = asyncHandler(async (req, res) => {
  // Guard against orphaning vehicles: block deletion if any vehicle is assigned.
  const vehicleCount = await Vehicle.countDocuments({ locationId: req.params.id });
  if (vehicleCount > 0) {
    throw ApiError.conflict(
      `Cannot delete: ${vehicleCount} vehicle(s) are assigned to this location. Reassign or transfer them first.`
    );
  }
  const location = await Location.findByIdAndUpdate(
    req.params.id,
    { status: 'INACTIVE' },
    { new: true }
  );
  if (!location) throw ApiError.notFound('Location not found');
  return sendSuccess(res, location, { message: 'Location deactivated' });
});

module.exports = { listPublic, list, getById, create, update, remove };
