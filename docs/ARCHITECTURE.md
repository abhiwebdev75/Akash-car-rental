# Car Rental Platform — Architecture

This document is the design blueprint the implementation follows. It covers the
system architecture, folder structure, database schema, entity relationships,
API surface, frontend routes, authentication flow, the booking/availability
algorithm, and the phased build plan.

---

## 1. Architecture Overview

The platform is a **three-tier application** split into two experiences that
share one backend:

```
┌─────────────────────┐     ┌─────────────────────┐
│  Customer Web App    │     │   Admin Dashboard    │
│  (React + Vite)      │     │   (React + Vite)     │
└──────────┬──────────┘     └──────────┬──────────┘
           │  HTTPS / JSON (REST)       │
           └──────────────┬─────────────┘
                          ▼
             ┌─────────────────────────┐
             │   Express REST API       │
             │   routes → controllers   │
             │   → services → models    │
             └───────────┬─────────────┘
                         │ Mongoose
                         ▼
             ┌─────────────────────────┐        ┌──────────────────┐
             │   MongoDB Atlas          │        │  Cloudinary       │
             │   (replica set)          │        │  (media/docs)     │
             └─────────────────────────┘        └──────────────────┘
```

### Design principles

- **Backend is the single source of truth** for availability, pricing, booking
  conflicts, and authorization. The frontend never computes a trusted price or
  decides availability.
- **Layered separation**: `routes` (HTTP wiring) → `controllers` (request/response
  orchestration) → `services` (business logic) → `models` (data). Business logic
  never lives in routes or controllers.
- **Stateless API** secured by JWT access tokens (+ refresh tokens), enabling
  horizontal scaling.
- **Everything is database-driven** — locations, pricing, business settings, tax
  rates, and policies are stored in MongoDB, never hardcoded.
- **Pure, testable core**: the overlap-detection and pricing math are pure
  functions with no DB dependency, so the most safety-critical logic is unit
  tested deterministically.
- **Provider abstractions** for payments, uploads, and notifications, so online
  gateways / WhatsApp / email / SMS can be added later without touching booking
  logic.

### Technology stack (backend, this phase)

| Concern            | Choice                                             |
|--------------------|----------------------------------------------------|
| Runtime            | Node.js 18+ (developed on Node 22)                 |
| Framework          | Express.js 4                                       |
| Database           | MongoDB Atlas + Mongoose 8                          |
| Auth               | JWT (access + refresh), bcrypt password hashing     |
| Validation         | Joi (schema-based, via a generic middleware)        |
| File storage       | Cloudinary (abstracted behind an upload service)    |
| PDF generation     | PDFKit (rental agreements)                          |
| Security           | helmet, cors, express-rate-limit, mongo-sanitize    |
| Testing            | Jest + Supertest + mongodb-memory-server            |
| Logging            | pino (structured) + morgan (HTTP)                   |

---

## 2. Folder Structure

```
Akash car rental/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js            # loads & validates environment variables
│   │   │   ├── db.js             # Mongoose connection (Atlas)
│   │   │   ├── cloudinary.js     # Cloudinary SDK config
│   │   │   └── constants.js      # roles, statuses, enums (single source)
│   │   ├── models/              # 18 Mongoose schemas (one file each)
│   │   ├── services/            # business logic (pure where possible)
│   │   │   ├── availability.service.js   # overlap engine (pure core)
│   │   │   ├── pricing.service.js         # pricing engine (pure core)
│   │   │   ├── bookingNumber.service.js   # atomic CR-YYYY-###### generator
│   │   │   ├── booking.service.js         # create/cancel w/ conflict guard
│   │   │   ├── coupon.service.js
│   │   │   ├── payment.service.js         # payment provider abstraction
│   │   │   ├── inspection.service.js      # pickup/return + charge calc
│   │   │   ├── agreement.service.js       # PDF generation
│   │   │   ├── notification.service.js    # channel abstraction
│   │   │   ├── report.service.js          # analytics aggregations
│   │   │   └── upload.service.js          # Cloudinary abstraction
│   │   ├── controllers/         # one per resource
│   │   ├── routes/              # one router per resource + index.js
│   │   ├── middleware/          # auth, rbac, validate, error, upload, rateLimit
│   │   ├── validation/          # Joi schemas per resource
│   │   ├── utils/               # ApiError, ApiResponse, asyncHandler, dates…
│   │   ├── app.js               # Express app assembly (no listen)
│   │   └── server.js            # entry point (connect DB + listen)
│   ├── tests/
│   │   ├── unit/                # pure logic: overlap, pricing, booking numbers
│   │   └── integration/        # supertest: auth, booking conflict, RBAC
│   ├── seed/seed.js            # dev seed data
│   ├── .env.example
│   ├── jest.config.js
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md          # this file
│   ├── DATABASE_SCHEMA.md       # field-level schema reference
│   └── API.md                   # endpoint reference
└── README.md
```

The **frontend** (`customer/` and `admin/` React apps) is planned in this document
and will be implemented in a following session per the agreed backend-first scope.

---

## 3. Database Schema (summary)

Full field-level detail lives in [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md).
Eighteen collections:

`User`, `Location`, `Vehicle`, `AddOn`, `Booking`, `Payment`,
`VehicleInspection`, `Damage`, `Maintenance`, `Document`, `RentalAgreement`,
`Coupon`, `Review`, `Notification`, `VehicleTransfer`, `EmergencyRequest`,
plus two supporting collections: `Counter` (atomic sequence numbers) and
`Settings` (singleton business configuration).

Nothing is stored as one giant document — entities reference each other by
`ObjectId`.

---

## 4. Entity Relationships (ERD)

```
User (OWNER|MANAGER|STAFF|ACCOUNTANT|CUSTOMER)
  │
  ├──< manages >── Location            (Location.manager → User)
  ├──< assigned to >── Location         (staff.assignedLocation → Location)
  │
Location 1 ──< has many >── Vehicle     (Vehicle.locationId → Location)
Location 1 ──< has many >── Booking     (Booking.locationId → Location)

Vehicle 1 ──< has many >── Booking      (Booking.vehicleId → Vehicle)
Vehicle 1 ──< has many >── Maintenance  (Maintenance.vehicleId → Vehicle)
Vehicle 1 ──< has many >── Damage       (Damage.vehicleId → Vehicle)
Vehicle 1 ──< has many >── VehicleTransfer
Vehicle 1 ──< has many >── Review

Customer(User) 1 ──< has many >── Booking   (Booking.customerId → User)
Customer(User) 1 ──< has many >── Document   (Document.ownerId → User)

Booking 1 ──1 RentalAgreement
Booking 1 ──< has many >── Payment
Booking 1 ──< 0..2 >── VehicleInspection   (type: PICKUP | RETURN)
Booking 1 ──< has many >── Damage           (new damage found at return)
Booking 1 ──1 Review
Booking *──< uses >── AddOn                  (embedded snapshot in booking)
Booking *──< uses >── Coupon                 (Booking.couponId → Coupon)
Booking 1 ──< has many >── EmergencyRequest

User 1 ──< receives >── Notification
```

Key rule: a **Vehicle's current location** is always `Vehicle.locationId`.
`VehicleTransfer` records history; committing a transfer updates
`Vehicle.locationId` and appends a transfer record — the two are kept consistent
in a single service call.

---

## 5. API Endpoints (summary)

Full request/response detail in [`API.md`](./API.md). All routes are under
`/api`. Grouping:

```
/api/auth          register, login, refresh, logout, me
/api/users         profile, admin user CRUD
/api/staff         owner-only staff management
/api/locations     CRUD + activate/deactivate + assign manager
/api/vehicles      CRUD + status change + filtering + availability
/api/addons        CRUD
/api/bookings      availability search, quote, create, cancel, lifecycle
/api/payments      record, list, refund
/api/inspections   pickup, return (+ charge calc)
/api/damages       report, update status
/api/maintenance   records + reminders/alerts
/api/documents     secure upload + gated download
/api/agreements    generate + view + PDF download
/api/reviews       create (completed rentals) + moderate
/api/coupons       CRUD + validate
/api/notifications list + mark read
/api/reports       revenue, utilization, location perf, CSV export
/api/emergency     create (active bookings) + admin handling
```

Standard response envelope:

```json
{ "success": true,  "data": { }, "meta": { } }
{ "success": false, "message": "Human readable error", "errors": [ ] }
```

---

## 6. Frontend Routes (planned)

### Customer app
```
/            /cars          /cars/:id      /compare
/booking     /login         /register
/dashboard   /bookings      /bookings/:id
/documents   /agreements    /profile       /reviews
/about       /contact       /terms         /privacy
```

### Admin app (protected)
```
/admin/login
/admin                      (dashboard / owner daily overview)
/admin/fleet                (vehicles grouped by location)
/admin/calendar             (booking calendar/table)
/admin/bookings             /admin/bookings/:id
/admin/customers            /admin/customers/:id
/admin/payments             /admin/inspections
/admin/maintenance          /admin/transfers
/admin/staff                (owner only)
/admin/coupons              /admin/reviews
/admin/reports              /admin/settings   (owner only)
```

---

## 7. Authentication & Authorization Flow

```
Register/Login ──► verify credentials (bcrypt) ──► issue:
     • accessToken  (JWT, short-lived, e.g. 15m)  → sent in Authorization: Bearer
     • refreshToken (JWT, long-lived, e.g. 7d)    → httpOnly cookie / body

Protected request:
  auth middleware verifies accessToken → loads req.user (id, role, location)
  rbac middleware checks role/permission for the route
  ownership checks in controller/service (e.g. a customer only sees own bookings)

Token refresh:
  POST /api/auth/refresh with valid refreshToken → new accessToken
```

- Passwords hashed with **bcrypt** (cost 10+); never stored or logged in plain.
- **Role-based access control** enforced by `authorize(...roles)` middleware plus
  fine-grained ownership checks. Authorization is **always enforced on the
  backend** — hiding a frontend button is never the security boundary.
- Roles: `OWNER`, `MANAGER`, `STAFF`, `ACCOUNTANT`, `CUSTOMER`.

Permission matrix (summary):

| Resource / Action        | OWNER | MANAGER | STAFF | ACCOUNTANT | CUSTOMER |
|--------------------------|:-----:|:-------:|:-----:|:----------:|:--------:|
| Locations (CRUD)         |  ✔    |  read   |  read |    read    |    –     |
| Vehicles (CRUD)          |  ✔    |   ✔     | status|    read    |  browse  |
| Bookings (manage all)    |  ✔    |   ✔     | assigned only | read |  own     |
| Payments (record)        |  ✔    |   ✔     |   –   |     ✔      |  own(view)|
| Inspections              |  ✔    |   ✔     |   ✔   |     –      |  own(view)|
| Maintenance              |  ✔    |   ✔     | update|    read    |    –     |
| Staff management         |  ✔    |   –     |   –   |     –      |    –     |
| Settings                 |  ✔    |   –     |   –   |     –      |    –     |
| Reports / Analytics      |  ✔    |   ✔     |   –   |  financial |    –     |
| Coupons                  |  ✔    |   ✔     |   –   |     –      | use only |

`MANAGER`/`STAFF` are additionally scoped to their **assigned location** for
operational data.

---

## 8. Booking & Availability Algorithm

This is the correctness-critical core. It is implemented as **pure functions**
plus a thin DB query layer.

### 8.1 Canonical time model
Every booking stores `startAt` and `endAt` as full UTC `Date`s (pickup/return
date combined with pickup/return time). All overlap math uses these.

### 8.2 Overlap rule (pure function)
Two intervals conflict when they are **not** separated by at least the configured
turnover buffer:

```
conflict(aStart, aEnd, bStart, bEnd, bufferMs) =
      aStart < (bEnd + bufferMs)  AND  bStart < (aEnd + bufferMs)
```

- `bufferMs = 0` → **same-day turnover allowed**: an existing `15→18` booking does
  NOT conflict with a new `18→20` booking (touching endpoints are fine).
- `bufferMs > 0` (e.g. cleaning/prep window) → touching or too-close bookings
  conflict. The buffer is stored in `Settings.booking.turnoverBufferMinutes`, so
  the behavior is **explicit and configurable**.

Worked examples (from the spec):
```
existing 15→18, new 17→20  → conflict (17 < 18 and 15 < 20)         → REJECT
existing 15→18, new 18→20  → no conflict when buffer 0              → ALLOW
existing 15→18, new 18→20  → conflict when buffer > 0               → REJECT
```

### 8.3 Availability query
`getAvailableVehicles({ locationId, start, end, filters })`:

1. Base set: vehicles at `locationId` whose status ∉ `{INACTIVE, MAINTENANCE}`
   and matching optional filters (type, seats, transmission, fuel, price,
   features).
2. Exclude vehicles with a **blocking booking** (`status ∈ {PENDING, CONFIRMED,
   ACTIVE}`) that overlaps `[start, end]` (buffer-aware; done at the DB level
   using indexed `startAt`/`endAt`, then confirmed by the pure function).
3. Exclude vehicles with a **scheduled/in-progress maintenance** window that
   overlaps `[start, end]`.
4. Return the survivors.

The vehicle's own `status` (`BOOKED`/`RENTED`) is a *current* snapshot for the
dashboard; **date-range availability is decided by actual bookings**, so a car
rented today is still bookable for a future free window.

### 8.4 Double-booking prevention (write path)
`createBooking()` runs inside a **MongoDB transaction** (Atlas is a replica set):

```
begin txn
  re-run the conflict query for (vehicle, start, end) with { blocking statuses }
  if any conflict → abort → 409 "Vehicle is not available for the selected dates."
  generate booking number atomically (Counter findOneAndUpdate $inc, upsert)
  insert booking
commit txn
```

Re-checking *inside* the transaction closes the check-then-act race between two
simultaneous requests. (Residual note: MongoDB has no range locks, so under
extreme concurrency an app-level lock or a reservation-slot table would harden
this further — documented as a future option; the transaction + re-check covers
realistic small/medium load.)

### 8.5 Pricing (pure function)
`quote({ vehicle, start, end, addOns, coupon, settings })`:

```
days      = max(1, ceil((endAt - startAt) / 24h))
base      = cheapest of { daily*days }  and  tiered(months·monthly + weeks·weekly + rem·daily)
addOnsSum = Σ addon priced by {PER_RENTAL | PER_DAY×days | PER_UNIT×qty}
discount  = coupon applied to (base + addOnsSum), respecting min-rental / max-cap
taxable   = base + addOnsSum − discount
tax       = round(taxable × taxRate)
total     = taxable + tax
deposit   = vehicle.securityDeposit          (refundable, tracked separately)
```

Extra-km and fuel/late/damage charges are computed at **return** by the
inspection service, not at booking time.

---

## 9. Implementation Phases

The full platform is planned in 11 phases (see the original brief). This session
delivers the **backend foundation through business operations & analytics**:

| Phase | Scope                                                        | This session |
|-------|--------------------------------------------------------------|:------------:|
| 1     | Setup, DB, env, User, auth, JWT, roles, errors, validation   |      ✔       |
| 2     | Locations, Vehicles, images, statuses, filtering             |      ✔       |
| 3     | Availability engine, bookings, conflict prevention, calendar |      ✔       |
| 4     | Customer website (React)                                     |  next session |
| 5     | Payments (manual, partial, deposits, refunds)               |      ✔       |
| 6     | Documents, secure access, agreements, PDF                    |      ✔       |
| 7     | Pickup/return inspections, damage, extra charges             |      ✔       |
| 8     | Maintenance, service/insurance/PUC reminders                 |      ✔       |
| 9     | Staff, transfers, notifications, WhatsApp, coupons, reviews  |      ✔       |
| 10    | Reports, utilization, CSV export                             |      ✔       |
| 11    | Loyalty, rental passport, emergency, online pay (arch. only) |  arch. ready |

After each phase the code is verified: imports, API contracts, model
relationships, auth, authorization, and error handling.
