/**
 * AddOn controller. Customers can list active add-ons (to attach to a booking);
 * managers/owners manage the catalog.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const AddOn = require('../models/AddOn');

const list = asyncHandler(async (req, res) => {
  // Public/customer callers see active add-ons only; staff can request all.
  const isStaff = req.user && req.user.isStaff;
  const filter = isStaff && req.query.all === 'true' ? {} : { active: true };
  const addOns = await AddOn.find(filter).sort({ name: 1 }).lean();
  return sendSuccess(res, addOns);
});

const create = asyncHandler(async (req, res) => {
  const addOn = await AddOn.create(req.body);
  return sendCreated(res, addOn);
});

const update = asyncHandler(async (req, res) => {
  const addOn = await AddOn.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!addOn) throw ApiError.notFound('Add-on not found');
  return sendSuccess(res, addOn);
});

const remove = asyncHandler(async (req, res) => {
  const addOn = await AddOn.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!addOn) throw ApiError.notFound('Add-on not found');
  return sendSuccess(res, addOn, { message: 'Add-on deactivated' });
});

module.exports = { list, create, update, remove };
