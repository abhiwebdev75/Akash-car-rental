/**
 * Vehicle controller — public catalog browsing, availability search (delegated
 * to the availability service, the source of truth), admin CRUD, and image
 * management (via the Cloudinary upload abstraction).
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Vehicle = require('../models/Vehicle');
const availabilityService = require('../services/availability.service');
const reviewService = require('../services/review.service');
const uploadService = require('../services/upload.service');
const { getPagination, getSort } = require('../utils/pagination');
const { VEHICLE_NON_BOOKABLE_STATUSES, VEHICLE_STATUS } = require('../config/constants');

/** Build a Mongoose filter from browse query params. */
function browseFilter(q, { publicOnly }) {
  const filter = {};
  if (publicOnly) filter.status = { $nin: [...VEHICLE_NON_BOOKABLE_STATUSES] };
  if (q.locationId) filter.locationId = q.locationId;
  if (q.vehicleType) filter.vehicleType = q.vehicleType;
  if (q.transmission) filter.transmission = q.transmission;
  if (q.fuelType) filter.fuelType = q.fuelType;
  if (q.minSeats) filter.seats = { $gte: Number(q.minSeats) };
  if (q.features && q.features.length) filter.features = { $all: q.features };
  const price = {};
  if (q.minPrice != null) price.$gte = Number(q.minPrice);
  if (q.maxPrice != null) price.$lte = Number(q.maxPrice);
  if (Object.keys(price).length) filter.dailyPrice = price;
  return filter;
}

/** Public catalog listing (no availability check — that's the search endpoint). */
const browse = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query.sort, { dailyPrice: 1 });
  const filter = browseFilter(req.query, { publicOnly: true });

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).populate('locationId', 'name city code').sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
    Vehicle.countDocuments(filter),
  ]);
  return sendPaginated(res, vehicles, { page, limit, total });
});

/** Public vehicle detail, enriched with rating summary + visible reviews. */
const getPublic = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).populate('locationId', 'name city code').lean({ virtuals: true });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  const [rating, reviews] = await Promise.all([
    reviewService.getVehicleRating(vehicle._id),
    reviewService.listForVehicle(vehicle._id),
  ]);
  return sendSuccess(res, { ...vehicle, rating, reviews });
});

/** Availability search: which vehicles are free for [start, end] at a location. */
const search = asyncHandler(async (req, res) => {
  const { locationId, start, end, ...filters } = req.query;
  const vehicles = await availabilityService.getAvailableVehicles({ locationId, start, end, filters });
  return sendSuccess(res, vehicles, { meta: { start, end, count: vehicles.length } });
});

// ── Admin ─────────────────────────────────────────────────────────────────

const adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query.sort);
  const filter = browseFilter(req.query, { publicOnly: false });
  if (req.query.status) filter.status = req.query.status;

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).populate('locationId', 'name city code').sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
    Vehicle.countDocuments(filter),
  ]);
  return sendPaginated(res, vehicles, { page, limit, total });
});

const create = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  return sendCreated(res, vehicle);
});

const update = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return sendSuccess(res, vehicle);
});

const remove = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { status: VEHICLE_STATUS.INACTIVE }, { new: true });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return sendSuccess(res, vehicle, { message: 'Vehicle deactivated' });
});

/** Upload one or more images and append them to the vehicle gallery. */
const uploadImages = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (!req.files || !req.files.length) throw ApiError.badRequest('No images uploaded');

  const uploaded = await uploadService.uploadMany(req.files, { folder: `vehicles/${vehicle._id}` });
  uploaded.forEach((u, i) => {
    vehicle.images.push({ url: u.url, publicId: u.publicId, isPrimary: vehicle.images.length === 0 && i === 0 });
  });
  await vehicle.save();
  return sendSuccess(res, vehicle.images, { message: 'Images uploaded' });
});

/** Remove one image (and delete the stored asset). */
const deleteImage = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  const { publicId } = req.body;
  const target = vehicle.images.find((i) => i.publicId === publicId);
  if (!target) throw ApiError.notFound('Image not found');

  await uploadService.destroy(target.publicId);
  vehicle.images = vehicle.images.filter((i) => i.publicId !== publicId);
  // If we removed the primary image, promote the first remaining one.
  if (!vehicle.images.some((i) => i.isPrimary) && vehicle.images[0]) {
    vehicle.images[0].isPrimary = true;
  }
  await vehicle.save();
  return sendSuccess(res, vehicle.images, { message: 'Image removed' });
});

module.exports = { browse, getPublic, search, adminList, create, update, remove, uploadImages, deleteImage };
