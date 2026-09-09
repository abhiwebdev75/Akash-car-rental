/**
 * Parses common pagination/sort query params into safe values and builds the
 * `meta` block returned alongside paginated lists.
 */
function getPagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || 20;
  const limit = Math.min(100, Math.max(1, rawLimit)); // cap to protect the DB
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build a Mongoose sort object from a `sort` query like "-createdAt,name".
 * Falls back to the provided default.
 */
function getSort(sortStr, fallback = { createdAt: -1 }) {
  if (!sortStr) return fallback;
  const sort = {};
  for (const field of String(sortStr).split(',')) {
    const trimmed = field.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('-')) sort[trimmed.slice(1)] = -1;
    else sort[trimmed] = 1;
  }
  return Object.keys(sort).length ? sort : fallback;
}

function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

module.exports = { getPagination, getSort, buildMeta };
