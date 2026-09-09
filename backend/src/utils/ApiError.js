/**
 * Operational (expected) errors carry an HTTP status and a safe, human-readable
 * message. The central error handler uses `isOperational` to decide whether the
 * message is safe to send to the client. Throw these from services/controllers.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status
   * @param {string} message    client-safe message
   * @param {object} [options]
   * @param {Array}  [options.errors] field-level validation errors
   * @param {string} [options.code]   machine-readable error code
   */
  constructor(statusCode, message, { errors = [], code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', opts) {
    return new ApiError(400, msg, opts);
  }
  static unauthorized(msg = 'Authentication required') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'You do not have permission to perform this action') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg);
  }
  static unprocessable(msg = 'Unprocessable request', opts) {
    return new ApiError(422, msg, opts);
  }
  static tooMany(msg = 'Too many requests') {
    return new ApiError(429, msg);
  }
}

module.exports = ApiError;
