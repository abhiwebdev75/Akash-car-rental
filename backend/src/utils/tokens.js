/**
 * JWT signing/verification helpers. Access tokens are short-lived and carry the
 * minimal claims needed for authorization (id, role, assignedLocation).
 * Refresh tokens carry only the subject id.
 */
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

function signAccessToken(user) {
  const payload = {
    sub: String(user._id || user.id),
    role: user.role,
    loc: user.assignedLocation ? String(user.assignedLocation) : null,
  };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id || user.id) }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
