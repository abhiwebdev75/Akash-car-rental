/**
 * Rate limiters. A general limiter protects the whole API; a stricter limiter
 * guards auth endpoints against brute-force attempts. Disabled during tests.
 */
const rateLimit = require('express-rate-limit');
const { config } = require('../config/env');

const passthrough = (_req, _res, next) => next();

const apiLimiter = config.isTest
  ? passthrough
  : rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
    });

const authLimiter = config.isTest
  ? passthrough
  : rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.authMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many attempts, please try again later.' },
    });

module.exports = { apiLimiter, authLimiter };
