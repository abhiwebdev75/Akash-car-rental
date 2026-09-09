/**
 * Wraps an async Express handler so rejected promises are forwarded to the
 * centralized error middleware instead of crashing the process. Every async
 * controller is wrapped in this.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
