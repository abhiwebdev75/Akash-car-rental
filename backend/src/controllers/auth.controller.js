/**
 * Auth controller — thin HTTP layer over the auth service. Refresh tokens are
 * additionally set as an httpOnly cookie so browser clients don't have to store
 * them in JS-accessible storage; the access token is returned in the body.
 */
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/ApiResponse');
const authService = require('../services/auth.service');
const { config } = require('../config/env');

const REFRESH_COOKIE = 'refreshToken';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  };
}

const register = asyncHandler(async (req, res) => {
  // No tokens yet — the account must verify its email first.
  const { user } = await authService.register(req.body);
  return sendCreated(
    res,
    { email: user.email, requiresVerification: true },
    { message: 'Account created. Check your email for a verification code.' }
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.verifyEmail(req.body);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return sendSuccess(res, { user, accessToken, refreshToken }, { message: 'Email verified' });
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body);
  return sendSuccess(res, null, { message: 'If the account needs verification, a new code has been sent.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  // Generic message regardless of whether the email exists (no enumeration).
  return sendSuccess(res, null, { message: 'If that email is registered, a reset code has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return sendSuccess(res, null, { message: 'Password reset. Please log in with your new password.' });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return sendSuccess(res, { user, accessToken, refreshToken });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || (req.cookies && req.cookies[REFRESH_COOKIE]);
  const { user, accessToken, refreshToken } = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return sendSuccess(res, { user, accessToken, refreshToken });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  return sendSuccess(res, null, { message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => sendSuccess(res, { user: req.user }));

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  return sendSuccess(res, null, { message: 'Password changed. Please log in again.' });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
};
