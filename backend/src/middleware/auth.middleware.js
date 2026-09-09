/**
 * Authentication middleware.
 * `authenticate` requires a valid access token and attaches the live user
 * document to `req.user`. `optionalAuth` attaches the user if a token is present
 * but never rejects (used by public endpoints that personalize when logged in).
 */
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokens');
const { USER_STATUS } = require('../config/constants');
const User = require('../models/User');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies && req.cookies.accessToken) return req.cookies.accessToken;
  return null;
}

const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token';
    throw ApiError.unauthorized(msg);
  }

  // Load the live user so status/role changes take effect immediately.
  const user = await User.findById(decoded.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('Account is inactive. Contact the administrator.');
  }

  req.user = user;
  return next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);
    if (user && user.status === USER_STATUS.ACTIVE) req.user = user;
  } catch {
    /* ignore — treated as anonymous */
  }
  return next();
});

module.exports = { authenticate, optionalAuth };
