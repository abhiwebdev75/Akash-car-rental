# API Reference

Base URL: `/api`. All responses use the envelope:

```json
// success
{ "success": true, "data": <payload>, "meta": { "page": 1, "total": 42 } }
// error
{ "success": false, "message": "Vehicle is not available for the selected dates.", "errors": [] }
```

Auth: send `Authorization: Bearer <accessToken>`. Roles in brackets show who may
call each endpoint (`CUSTOMER own` = only the customer's own resources). All
authorization is enforced server-side.

---

## Auth — `/api/auth`
| Method | Path            | Access   | Description |
|--------|-----------------|----------|-------------|
| POST   | /register       | public   | Register a customer; returns tokens |
| POST   | /login          | public   | Login; returns access + refresh tokens |
| POST   | /refresh        | public   | Exchange refresh token for new access token |
| POST   | /logout         | auth     | Revoke refresh token |
| GET    | /me             | auth     | Current user profile |

## Users — `/api/users`
| Method | Path       | Access | Description |
|--------|------------|--------|-------------|
| GET    | /          | OWNER, MANAGER | List/search users (paginated) |
| GET    | /:id       | OWNER, MANAGER, self | Get user |
| PATCH  | /me        | auth   | Update own profile |
| PATCH  | /:id       | OWNER  | Update a user |
| GET    | /:id/summary | OWNER, MANAGER | Customer stats: bookings, spend, rental days |

## Staff — `/api/staff` (OWNER only)
| Method | Path            | Description |
|--------|-----------------|-------------|
| POST   | /               | Create staff (role, assignedLocation) |
| GET    | /               | List staff |
| PATCH  | /:id            | Update role/location/status |
| PATCH  | /:id/status     | Activate/deactivate |
| POST   | /:id/reset-access | Reset password / revoke tokens |

## Locations — `/api/locations`
| Method | Path              | Access | Description |
|--------|-------------------|--------|-------------|
| GET    | /                 | public | Active locations (for booking widget) |
| GET    | /:id              | public | Location details |
| POST   | /                 | OWNER  | Create |
| PATCH  | /:id              | OWNER  | Update |
| PATCH  | /:id/status       | OWNER  | Activate/deactivate |
| PATCH  | /:id/assign-manager | OWNER | Assign manager |
| GET    | /:id/vehicles     | OWNER, MANAGER | Vehicles at location |
| GET    | /:id/bookings     | OWNER, MANAGER | Bookings at location |

## Vehicles — `/api/vehicles`
| Method | Path            | Access | Description |
|--------|-----------------|--------|-------------|
| GET    | /               | public | List/filter (type, seats, transmission, fuel, price, features, location) |
| GET    | /:id            | public | Vehicle details + reviews |
| POST   | /               | OWNER, MANAGER | Create |
| PATCH  | /:id            | OWNER, MANAGER | Update |
| PATCH  | /:id/status     | OWNER, MANAGER, STAFF | Change status |
| POST   | /:id/images     | OWNER, MANAGER | Upload images (multipart) |
| DELETE | /:id/images/:publicId | OWNER, MANAGER | Remove image |
| POST   | /:id/transfer   | OWNER, MANAGER | Transfer to another location |
| GET    | /:id/availability | public | Is this vehicle free for ?start&end |

## Add-ons — `/api/addons`
| Method | Path   | Access | Description |
|--------|--------|--------|-------------|
| GET    | /      | public | Active add-ons |
| POST   | /      | OWNER, MANAGER | Create |
| PATCH  | /:id   | OWNER, MANAGER | Edit / disable / change price |

## Bookings — `/api/bookings`
| Method | Path                  | Access | Description |
|--------|-----------------------|--------|-------------|
| GET    | /availability         | public | **Availability engine**: ?locationId&start&end&filters → available vehicles |
| POST   | /quote                | public | **Pricing engine**: trusted price for vehicle+dates+addons+coupon |
| POST   | /                     | CUSTOMER, OWNER, MANAGER | Create booking (conflict-guarded, transactional) |
| GET    | /                     | OWNER, MANAGER, ACCOUNTANT | List/filter all bookings |
| GET    | /mine                 | CUSTOMER | Own bookings |
| GET    | /calendar             | OWNER, MANAGER, STAFF | Calendar/table data (?locationId&from&to) |
| GET    | /:id                  | staff / owner of booking | Details |
| POST   | /:id/confirm          | OWNER, MANAGER | PENDING → CONFIRMED |
| POST   | /:id/cancel           | owner of booking, OWNER, MANAGER | Cancel (policy-aware) |
| POST   | /:id/activate         | OWNER, MANAGER, STAFF | CONFIRMED → ACTIVE (after pickup) |
| POST   | /:id/complete         | OWNER, MANAGER, STAFF | ACTIVE → COMPLETED (after return) |

## Payments — `/api/payments`
| Method | Path            | Access | Description |
|--------|-----------------|--------|-------------|
| POST   | /               | OWNER, MANAGER, ACCOUNTANT | Record payment (rental/deposit/extra) |
| GET    | /               | OWNER, MANAGER, ACCOUNTANT | List/filter |
| GET    | /booking/:bookingId | staff / owner of booking | Payments for a booking |
| POST   | /:id/refund     | OWNER, ACCOUNTANT | Record refund |

## Inspections — `/api/inspections`
| Method | Path                | Access | Description |
|--------|---------------------|--------|-------------|
| POST   | /pickup             | OWNER, MANAGER, STAFF | Create pickup inspection (+photos) |
| POST   | /return             | OWNER, MANAGER, STAFF | Create return inspection → charge calc |
| GET    | /booking/:bookingId | staff / owner of booking | Inspections for a booking |

## Damages — `/api/damages`
| Method | Path      | Access | Description |
|--------|-----------|--------|-------------|
| POST   | /         | OWNER, MANAGER, STAFF | Report damage (+photos) |
| GET    | /         | OWNER, MANAGER | List/filter |
| PATCH  | /:id      | OWNER, MANAGER | Update status/cost |

## Maintenance — `/api/maintenance`
| Method | Path       | Access | Description |
|--------|------------|--------|-------------|
| POST   | /          | OWNER, MANAGER | Schedule/record maintenance |
| GET    | /          | OWNER, MANAGER | List/filter |
| PATCH  | /:id       | OWNER, MANAGER | Update/complete |
| GET    | /alerts    | OWNER, MANAGER | Service/insurance/PUC due-soon alerts |

## Documents — `/api/documents`
| Method | Path            | Access | Description |
|--------|-----------------|--------|-------------|
| POST   | /               | auth (multipart) | Upload own document (validated) |
| GET    | /mine           | CUSTOMER | List own documents |
| GET    | /user/:userId   | OWNER, MANAGER | List a customer's documents |
| GET    | /:id/download   | owner / authorized staff | **Gated** signed-URL access |
| PATCH  | /:id/verify     | OWNER, MANAGER | Verify/reject |

## Agreements — `/api/agreements`
| Method | Path            | Access | Description |
|--------|-----------------|--------|-------------|
| POST   | /booking/:bookingId | OWNER, MANAGER | Generate agreement (PDF) |
| GET    | /booking/:bookingId | owner of booking / staff | Get agreement |
| GET    | /:id/pdf        | owner of booking / staff | Download PDF |

## Reviews — `/api/reviews`
| Method | Path            | Access | Description |
|--------|-----------------|--------|-------------|
| POST   | /               | CUSTOMER (completed rental) | Create review |
| GET    | /vehicle/:vehicleId | public | Visible reviews |
| PATCH  | /:id/moderate   | OWNER, MANAGER | Hide/feature |

## Coupons — `/api/coupons`
| Method | Path        | Access | Description |
|--------|-------------|--------|-------------|
| POST   | /validate   | public | Validate a code against a rental subtotal |
| GET    | /           | OWNER, MANAGER | List |
| POST   | /           | OWNER, MANAGER | Create |
| PATCH  | /:id        | OWNER, MANAGER | Update/disable |

## Notifications — `/api/notifications`
| Method | Path          | Access | Description |
|--------|---------------|--------|-------------|
| GET    | /             | auth   | Own notifications (?unread) |
| PATCH  | /:id/read     | auth   | Mark read |
| PATCH  | /read-all     | auth   | Mark all read |

## Reports — `/api/reports` (OWNER, MANAGER; financial ones also ACCOUNTANT)
| Method | Path                | Description |
|--------|---------------------|-------------|
| GET    | /revenue            | Revenue daily/monthly (?from&to&groupBy) |
| GET    | /bookings           | Bookings + cancellations |
| GET    | /utilization        | Fleet utilization % from real bookings |
| GET    | /locations          | Location performance |
| GET    | /customers          | Customer growth |
| GET    | /maintenance        | Maintenance expenses |
| GET    | /outstanding        | Outstanding payments |
| GET    | /dashboard          | Owner daily dashboard aggregate |
| GET    | /export/:report.csv | CSV export |

## Emergency — `/api/emergency`
| Method | Path        | Access | Description |
|--------|-------------|--------|-------------|
| POST   | /           | CUSTOMER (active booking) | Raise assistance request |
| GET    | /           | OWNER, MANAGER, STAFF | List requests |
| PATCH  | /:id        | OWNER, MANAGER, STAFF | Acknowledge/resolve |

---

### Common error codes
| Status | Meaning |
|--------|---------|
| 400 | Validation error (Joi) |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated but not permitted (role/ownership) |
| 404 | Resource not found |
| 409 | Conflict — e.g. double-booking, duplicate registration/email |
| 422 | Business rule violation (e.g. review before completion) |
| 429 | Rate limited |
| 500 | Unexpected (no stack trace leaked in production) |
