/**
 * Centralized error handling. Every thrown/forwarded error lands here and is
 * translated into the standard `{ success:false, message, errors }` envelope.
 * Known error shapes (Mongoose, Mongo duplicate key, JWT, Multer) are mapped to
 * clean client messages; unknown errors return a generic 500 with no stack leak
 * in production.
 */
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { config } = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];
  let code = err.code;

  // Mongoose: bad ObjectId / cast failure
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
  }

  // Mongoose: schema validation
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // MongoDB: duplicate unique key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
    code = 'DUPLICATE_KEY';
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired';
  }

  // Multer upload errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : `Upload error: ${err.message}`;
  }

  // Anything non-operational and 500-level: log the full error, hide details.
  const isServerError = statusCode >= 500;
  if (isServerError) {
    logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');
    if (config.isProd) message = 'Something went wrong. Please try again later.';
  }

  const body = { success: false, message };
  if (errors && errors.length) body.errors = errors;
  if (code) body.code = code;
  // Expose stack only outside production to aid debugging.
  if (!config.isProd && isServerError) body.stack = err.stack;

  return res.status(statusCode).json(body);
}

/** 404 handler for unmatched routes. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFound };
