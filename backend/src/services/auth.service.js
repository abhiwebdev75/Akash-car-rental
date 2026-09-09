/**
 * Auth service — registration, login, token issuance/rotation, and logout.
 * Passwords and refresh tokens are only ever stored hashed. Access tokens are
 * short-lived; refresh tokens are rotated on every use and revocable per user.
 */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokens');
const { ROLES, USER_STATUS } = require('../config/constants');

/** Sign a new access/refresh pair and persist the refresh-token hash. */
async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await user.setRefreshToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();
  return { accessToken, refreshToken };
}

/** Register a new CUSTOMER account. Staff accounts are created by admins. */
async function register({ name, email, phone, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const user = new User({ name, email, phone, role: ROLES.CUSTOMER });
  await user.setPassword(password);
  await user.save();

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

/** Verify credentials and issue tokens. */
async function login({ email, password }) {
  // passwordHash is select:false, so request it explicitly.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  if (user.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('Account is inactive. Contact the administrator.');
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

/** Rotate tokens using a valid, non-revoked refresh token. */
async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token required');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash');
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.status !== USER_STATUS.ACTIVE) throw ApiError.forbidden('Account is inactive');

  const matches = await user.compareRefreshToken(refreshToken);
  if (!matches) throw ApiError.unauthorized('Refresh token has been revoked');

  const tokens = await issueTokens(user); // rotation: new refresh token stored
  return { user, ...tokens };
}

/** Revoke the stored refresh token (logout everywhere). */
async function logout(userId) {
  const user = await User.findById(userId).select('+refreshTokenHash');
  if (user) {
    await user.setRefreshToken(null);
    await user.save();
  }
  return true;
}

/** Change the current user's password (requires the current one). */
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.badRequest('Current password is incorrect');
  await user.setPassword(newPassword);
  await user.setRefreshToken(null); // force re-login elsewhere
  await user.save();
  return true;
}

module.exports = { issueTokens, register, login, refresh, logout, changePassword };
