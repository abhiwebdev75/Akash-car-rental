/**
 * Standard success response envelope, mirroring the error handler's shape.
 * Success: { success:true, data, ...meta }.  Errors are produced by the error
 * middleware. Keeping this in one place guarantees a consistent API contract.
 */

/** 200 OK (or custom status) with a data payload. */
function sendSuccess(res, data = null, { status = 200, message, meta } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  body.data = data;
  return res.status(status).json(body);
}

/** 201 Created convenience. */
function sendCreated(res, data = null, opts = {}) {
  return sendSuccess(res, data, { ...opts, status: 201 });
}

/** Paginated list response: data is the array, meta carries page info. */
function sendPaginated(res, items, { page, limit, total }) {
  return sendSuccess(res, items, {
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    },
  });
}

module.exports = { sendSuccess, sendCreated, sendPaginated };
