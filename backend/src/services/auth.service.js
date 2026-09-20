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
const { ROLES, USER_STATUS, OTP_PURPOSE } = require('../config/constants');
const otpService = require('./otp.service');

/** Sign a new access/refresh pair and persist the refresh-token hash. */
async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await user.setRefreshToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();
  return { accessToken, refreshToken };
}

/**
 * Register a new CUSTOMER account. The account is created *unverified* and NO
 * tokens are issued — the caller must confirm the emailed OTP via verifyEmail
 * before they can sign in. Staff accounts are created by admins (pre-verified).
 */
async function register({ name, email, phone, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const user = new User({ name, email, phone, role: ROLES.CUSTOMER });
  await user.setPassword(password);
  await user.save();

  await otpService.generateAndSend({ user, purpose: OTP_PURPOSE.EMAIL_VERIFICATION });
  // Deliberately no tokens: gate access until the email is verified.
  return { user, requiresVerification: true };
}

/**
 * Confirm a signup OTP. On success the account is marked verified and tokens
 * are issued (this is effectively the first login).
 */
async function verifyEmail({ email, code }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw ApiError.badRequest('No account found for that email.');
  if (user.emailVerifiedAt) {
    // Already verified — treat as success and just issue tokens.
    const tokens = await issueTokens(user);
    return { user, ...tokens };
  }

  await otpService.verify({ userId: user._id, purpose: OTP_PURPOSE.EMAIL_VERIFICATION, code });

  user.emailVerifiedAt = new Date();
  const tokens = await issueTokens(user); // saves the user (issueTokens calls save)
  return { user, ...tokens };
}

/** Re-send a signup verification code (no-op response if already verified). */
async function resendVerification({ email }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Don't reveal whether the account exists; silently succeed otherwise.
  if (user && !user.emailVerifiedAt) {
    await otpService.generateAndSend({ user, purpose: OTP_PURPOSE.EMAIL_VERIFICATION });
  }
  return true;
}

/** Verify credentials and issue tokens. Unverified customers are blocked. */
async function login({ email, password }) {
  // passwordHash is select:false, so request it explicitly.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  if (user.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('Account is inactive. Contact the administrator.');
  }

  // Only self-registering customers go through email verification; staff
  // accounts are provisioned pre-verified by admins.
  if (user.role === ROLES.CUSTOMER && !user.emailVerifiedAt) {
    // Re-send a code so the client can take them straight to the verify screen.
    await otpService
      .generateAndSend({ user, purpose: OTP_PURPOSE.EMAIL_VERIFICATION })
      .catch(() => {});
    throw new ApiError(403, 'Please verify your email to continue.', {
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

/**
 * Start a password reset: email a reset OTP. Always resolves the same way
 * whether or not the account exists, so we don't leak which emails are
 * registered.
 */
async function forgotPassword({ email }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    await otpService.generateAndSend({ user, purpose: OTP_PURPOSE.PASSWORD_RESET });
  }
  return true;
}

/**
 * Complete a password reset with a valid OTP. Sets the new password and revokes
 * any existing sessions (refresh token) so a compromised session can't persist.
 */
async function resetPassword({ email, code, newPassword }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw ApiError.badRequest('No account found for that email.');

  await otpService.verify({ userId: user._id, purpose: OTP_PURPOSE.PASSWORD_RESET, code });

  await user.setPassword(newPassword);
  await user.setRefreshToken(null);
  // A successful reset also proves control of the inbox — treat as verified.
  if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
  await user.save();
  return true;
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

module.exports = {
  issueTokens,
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
};
