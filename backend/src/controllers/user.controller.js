/**
 * User controller. Covers admin user management (list/create staff/update/
 * deactivate) and self-service profile (me/updateProfile). Roles are assigned by
 * admins only; customers can never elevate themselves. Passwords are set through
 * the model's setPassword (bcrypt) and never returned.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// ── Self-service ─────────────────────────────────────────────────────────────

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');
  return sendSuccess(res, user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');
  const { name, phone, address, profilePhoto } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
  await user.save();
  return sendSuccess(res, user, { message: 'Profile updated' });
});

// ── Admin management ─────────────────────────────────────────────────────────

const list = asyncHandler(async (req, res) => {
  const { role, status, q, page, limit, sort } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return sendPaginated(res, items, { page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  return sendSuccess(res, user);
});

const createStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, assignedLocation } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('A user with that email already exists');

  const user = new User({ name, email, phone, role, assignedLocation });
  await user.setPassword(password);
  await user.save();
  return sendCreated(res, user, { message: 'Staff account created' });
});

const update = asyncHandler(async (req, res) => {
  const { name, phone, role, status, assignedLocation } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (role !== undefined) update.role = role;
  if (status !== undefined) update.status = status;
  if (assignedLocation !== undefined) update.assignedLocation = assignedLocation;

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!user) throw ApiError.notFound('User not found');
  return sendSuccess(res, user, { message: 'User updated' });
});

module.exports = { me, updateProfile, list, getById, createStaff, update };
