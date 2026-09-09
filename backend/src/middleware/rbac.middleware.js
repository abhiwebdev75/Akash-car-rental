/**
 * Role-based access control. `authorize(...roles)` gates a route to the given
 * roles. Fine-grained ownership/location checks live in services/controllers,
 * because RBAC alone can't express "a customer may only read their own booking".
 *
 * Authorization is always enforced here on the backend — never by hiding UI.
 */
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

function authorize(...allowedRoles) {
  const allowed = allowedRoles.flat();
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden('Your role cannot perform this action'));
    }
    return next();
  };
}

/** Convenience guards for common role sets. */
const requireOwner = authorize(ROLES.OWNER);
const requireManagerUp = authorize(ROLES.OWNER, ROLES.MANAGER);
const requireStaffUp = authorize(ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF);
const requireFinance = authorize(ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTANT);

/**
 * Returns true when the user is limited to a single assigned location
 * (MANAGER/STAFF). OWNER/ACCOUNTANT see all locations.
 */
function isLocationScoped(user) {
  return [ROLES.MANAGER, ROLES.STAFF].includes(user.role) && Boolean(user.assignedLocation);
}

/**
 * Assert a location-scoped staff member is acting within their assigned
 * location. No-op for OWNER/ACCOUNTANT (unscoped).
 */
function assertLocationAccess(user, locationId) {
  if (!isLocationScoped(user)) return;
  if (String(user.assignedLocation) !== String(locationId)) {
    throw ApiError.forbidden('This resource belongs to a different location');
  }
}

module.exports = {
  authorize,
  requireOwner,
  requireManagerUp,
  requireStaffUp,
  requireFinance,
  isLocationScoped,
  assertLocationAccess,
};
