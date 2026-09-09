# Database Schema Reference

MongoDB + Mongoose. Every collection uses `ObjectId` references (no giant nested
documents). `createdAt`/`updatedAt` are added by `{ timestamps: true }` on all
schemas. Indexes listed per collection are created in the model files.

Legend: `ref` = reference to another collection, `*` = required, `U` = unique.

---

## User
Authentication + all human actors (staff roles and customers).

| Field            | Type                | Notes |
|------------------|---------------------|-------|
| name*            | String              | |
| email* U         | String (lowercased) | login id |
| phone U          | String              | |
| passwordHash*    | String              | bcrypt; never returned (`select:false`) |
| role*            | Enum                | OWNER, MANAGER, STAFF, ACCOUNTANT, CUSTOMER |
| status           | Enum                | ACTIVE, INACTIVE (default ACTIVE) |
| assignedLocation | ref Location        | for MANAGER/STAFF scoping |
| address          | Object              | line1, city, state, pincode |
| profilePhoto     | Object              | { url, publicId } (Cloudinary) |
| refreshTokenHash | String (select:false)| for refresh-token rotation/revocation |
| loyalty          | Object              | points, completedRentals, referralCount, totalSpend |
| lastLoginAt      | Date                | |

Indexes: `email` (U), `phone` (U, sparse), `role`, `assignedLocation`.

---

## Location
First-class entity; never hardcoded.

| Field    | Type         | Notes |
|----------|--------------|-------|
| name*    | String       | |
| code U   | String       | short code e.g. CHD, MOH |
| address* | String       | |
| city*    | String       | |
| state    | String       | |
| pincode  | String       | |
| phone    | String       | |
| manager  | ref User     | must be MANAGER/OWNER |
| status   | Enum         | ACTIVE, INACTIVE |
| geo      | Object       | { lat, lng } (future maps) |

Indexes: `code` (U), `status`, `city`.

---

## Vehicle

| Field              | Type    | Notes |
|--------------------|---------|-------|
| brand*             | String  | |
| model*             | String  | |
| variant            | String  | |
| year               | Number  | |
| registrationNumber* U | String | uppercased |
| vehicleType*       | Enum    | HATCHBACK, SEDAN, SUV, MUV, LUXURY, VAN |
| transmission*      | Enum    | MANUAL, AUTOMATIC |
| fuelType*          | Enum    | PETROL, DIESEL, ELECTRIC, HYBRID, CNG |
| seats*             | Number  | |
| luggageCapacity    | Number  | bags |
| description        | String  | |
| features           | [String]| e.g. AC, Bluetooth, Sunroof |
| images             | [{url, publicId, isPrimary}] | Cloudinary |
| locationId* ref    | Location| **current** location (source of truth) |
| status*            | Enum    | AVAILABLE, BOOKED, RENTED, MAINTENANCE, RESERVED, INACTIVE |
| dailyPrice*        | Number  | |
| weeklyPrice        | Number  | optional tier |
| monthlyPrice       | Number  | optional tier |
| securityDeposit    | Number  | refundable |
| extraKmPrice       | Number  | per km beyond allowance |
| kmPerDayAllowance  | Number  | free km/day (0 = unlimited) |
| currentMileage     | Number  | odometer |
| nextServiceMileage | Number  | |
| lastServiceDate    | Date    | |
| insuranceExpiry    | Date    | reminder source |
| pucExpiry          | Date    | reminder source |

Indexes: `registrationNumber` (U), `locationId`, `status`,
`{ locationId: 1, status: 1 }`, `vehicleType`, `dailyPrice`.

---

## AddOn

| Field       | Type   | Notes |
|-------------|--------|-------|
| name*       | String | Additional Driver, Child Seat, GPS, Extra Insurance, Airport Pickup, Other |
| description | String | |
| price*      | Number | |
| pricingType | Enum   | PER_RENTAL, PER_DAY, PER_UNIT |
| maxQuantity | Number | for PER_UNIT (e.g. child seats) |
| active      | Boolean| |

---

## Booking

| Field             | Type      | Notes |
|-------------------|-----------|-------|
| bookingNumber* U  | String    | `CR-YYYY-000001` (atomic Counter) |
| customerId* ref   | User      | |
| vehicleId* ref    | Vehicle   | |
| locationId* ref   | Location  | pickup location |
| returnLocationId ref | Location | defaults to locationId; enables future one-way |
| pickupDate*       | Date      | date part |
| returnDate*       | Date      | date part |
| pickupTime        | String    | "HH:mm" |
| returnTime        | String    | "HH:mm" |
| startAt* (idx)    | Date      | canonical UTC datetime for overlap |
| endAt* (idx)      | Date      | canonical UTC datetime for overlap |
| status*           | Enum      | PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED, NO_SHOW |
| addOns            | [{addOnId, name, pricingType, unitPrice, quantity, lineTotal}] | snapshot |
| couponId ref      | Coupon    | |
| pricingBreakdown  | Object    | { days, baseStrategy, base, addOnsTotal, subtotal } |
| discount          | Number    | |
| tax               | Number    | |
| taxRate           | Number    | snapshot at booking time |
| securityDeposit   | Number    | |
| totalAmount*      | Number    | rental total incl. tax (excl. deposit) |
| amountPaid        | Number    | denormalized from Payments |
| amountRemaining   | Number    | derived |
| paymentStatus     | Enum      | PENDING, PARTIAL, PAID, REFUNDED, FAILED |
| specialRequests   | String    | |
| cancellation      | Object    | { at, by, reason, refundAmount } |
| createdBy ref     | User      | admin/customer who created |

Indexes: `bookingNumber`(U), `vehicleId`, `customerId`, `locationId`, `status`,
`{ vehicleId:1, status:1, startAt:1, endAt:1 }` (availability),
`{ startAt:1, endAt:1 }`.

---

## Payment

| Field           | Type    | Notes |
|-----------------|---------|-------|
| bookingId* ref  | Booking | |
| customerId ref  | User    | |
| kind*           | Enum    | RENTAL, DEPOSIT, DEPOSIT_REFUND, EXTRA_CHARGES, REFUND |
| amount*         | Number  | |
| method          | Enum    | CASH, CARD, UPI, BANK_TRANSFER, ONLINE, OTHER |
| status          | Enum    | PENDING, PARTIAL, PAID, REFUNDED, FAILED |
| provider        | String  | manual / razorpay / stripe (abstraction) |
| transactionRef  | String  | |
| paidAt          | Date    | |
| recordedBy ref  | User    | |
| notes           | String  | |

Indexes: `bookingId`, `customerId`, `status`, `kind`, `paidAt`.

---

## VehicleInspection

| Field           | Type     | Notes |
|-----------------|----------|-------|
| bookingId* ref  | Booking  | |
| vehicleId* ref  | Vehicle  | |
| type*           | Enum     | PICKUP, RETURN |
| odometer*       | Number   | |
| fuelLevel       | Number   | 0–100 (%) or eighths |
| exteriorCondition | Enum   | EXCELLENT, GOOD, FAIR, POOR |
| interiorCondition | Enum   | EXCELLENT, GOOD, FAIR, POOR |
| tyreCondition   | Enum     | EXCELLENT, GOOD, FAIR, POOR |
| existingDamage  | String   | free text notes |
| notes           | String   | |
| photos          | [{category, url, publicId}] | FRONT, REAR, LEFT, RIGHT, INTERIOR, DASHBOARD, DAMAGE |
| performedBy* ref| User     | staff |
| performedAt     | Date     | |
| customerConfirmed | Boolean| |
| customerSignature | String | data-url / stored ref |

Indexes: `bookingId`, `vehicleId`, `{ bookingId:1, type:1 }` (U pair).

---

## Damage

| Field          | Type    | Notes |
|----------------|---------|-------|
| vehicleId* ref | Vehicle | |
| bookingId ref  | Booking | which rental caused it (nullable) |
| type           | String  | scratch, dent, glass… |
| description    | String  | |
| severity       | Enum    | MINOR, MODERATE, SEVERE |
| photos         | [{url, publicId}] | |
| estimatedCost  | Number  | |
| finalCost      | Number  | |
| status         | Enum    | REPORTED, UNDER_REVIEW, REPAIRING, RESOLVED |
| reportedBy ref | User    | |
| reportedAt     | Date    | |
| resolvedAt     | Date    | |

Indexes: `vehicleId`, `bookingId`, `status`.

---

## Maintenance

| Field           | Type    | Notes |
|-----------------|---------|-------|
| vehicleId* ref  | Vehicle | |
| type*           | Enum    | SERVICE, OIL_CHANGE, TYRE_REPLACEMENT, BRAKE_SERVICE, REPAIR, INSURANCE, PUC, OTHER |
| description     | String  | |
| status          | Enum    | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| scheduledStart  | Date    | blocks availability window |
| scheduledEnd    | Date    | |
| completedAt     | Date    | |
| cost            | Number  | |
| odometerAtService | Number| |
| vendor          | String  | |
| performedBy ref | User    | |
| notes           | String  | |

Indexes: `vehicleId`, `status`, `{ vehicleId:1, status:1, scheduledStart:1, scheduledEnd:1 }`.

---

## Document
Sensitive customer files — never served via public URL.

| Field        | Type   | Notes |
|--------------|--------|-------|
| ownerId* ref | User   | who it belongs to |
| bookingId ref| Booking| optional linkage |
| type*        | Enum   | DRIVING_LICENCE, GOVERNMENT_ID, OTHER |
| fileUrl*     | String | Cloudinary **private/authenticated** URL |
| publicId     | String | Cloudinary id |
| fileName     | String | |
| mimeType     | String | validated (pdf/jpg/png) |
| sizeBytes    | Number | validated (max) |
| status       | Enum   | PENDING, VERIFIED, REJECTED |
| verifiedBy ref | User | |
| uploadedAt   | Date   | |

Indexes: `ownerId`, `bookingId`, `type`.
Access: only the owner or authorized staff; downloads go through a gated
controller that streams/redirects to a **signed** URL.

---

## RentalAgreement

| Field          | Type    | Notes |
|----------------|---------|-------|
| bookingId* U ref | Booking | one per booking |
| agreementNumber U| String | `AGR-YYYY-######` |
| snapshot       | Object  | business/customer/vehicle/terms captured at generation |
| pdf            | Object  | { url, publicId } |
| generatedBy ref| User    | |
| generatedAt    | Date    | |
| customerSigned | Boolean | |
| signedAt       | Date    | |

Indexes: `bookingId`(U), `agreementNumber`(U).

---

## Coupon

| Field         | Type   | Notes |
|---------------|--------|-------|
| code* U       | String | uppercased |
| type*         | Enum   | PERCENTAGE, FIXED |
| value*        | Number | percent or amount |
| minimumRental | Number | min rental subtotal to qualify |
| maximumDiscount | Number | cap for PERCENTAGE |
| startDate     | Date   | |
| endDate       | Date   | |
| usageLimit    | Number | total redemptions allowed |
| usedCount     | Number | |
| active        | Boolean| |

Indexes: `code`(U), `active`.

---

## Review
Only for completed rentals.

| Field         | Type   | Notes |
|---------------|--------|-------|
| customerId* ref | User | |
| vehicleId* ref  | Vehicle | |
| bookingId* U ref| Booking | one review per booking |
| rating*       | Number | 1–5 |
| review        | String | |
| status        | Enum   | VISIBLE, HIDDEN |
| featured      | Boolean| |

Indexes: `vehicleId`, `bookingId`(U), `status`.

---

## Notification
Internal notifications; channel-agnostic.

| Field      | Type   | Notes |
|------------|--------|-------|
| userId* ref| User   | recipient |
| audience   | Enum   | CUSTOMER, ADMIN |
| type*      | Enum   | BOOKING_CONFIRMED, BOOKING_CANCELLED, PAYMENT_RECEIVED, PAYMENT_PENDING, PICKUP_REMINDER, RETURN_REMINDER, AGREEMENT_GENERATED, NEW_BOOKING, VEHICLE_RETURN, DAMAGE_REPORTED, MAINTENANCE_DUE, INSURANCE_EXPIRY, PUC_EXPIRY, EMERGENCY |
| title*     | String | |
| body       | String | |
| data       | Object | ids for deep-linking |
| channels   | [Enum] | IN_APP, EMAIL, WHATSAPP, SMS (dispatch abstraction) |
| readAt      | Date  | null = unread |

Indexes: `{ userId:1, readAt:1 }`, `type`.

---

## VehicleTransfer

| Field           | Type    | Notes |
|-----------------|---------|-------|
| vehicleId* ref  | Vehicle | |
| fromLocationId* ref | Location | |
| toLocationId* ref   | Location | |
| reason          | String  | |
| status          | Enum    | PENDING, IN_TRANSIT, COMPLETED, CANCELLED |
| transferDate    | Date    | |
| completedAt     | Date    | on complete → Vehicle.locationId updated |
| requestedBy ref | User    | |

Indexes: `vehicleId`, `status`.

---

## EmergencyRequest

| Field        | Type    | Notes |
|--------------|---------|-------|
| bookingId* ref | Booking | must be ACTIVE |
| customerId ref | User  | |
| vehicleId ref  | Vehicle | |
| type*        | Enum    | BREAKDOWN, FLAT_TYRE, ACCIDENT, BATTERY, LOCKED_OUT, OTHER |
| description  | String  | |
| location     | Object  | { text, lat, lng } |
| phone        | String  | |
| photos       | [{url, publicId}] | |
| status       | Enum    | OPEN, ACKNOWLEDGED, RESOLVED, CANCELLED |
| handledBy ref| User    | |
| createdAt    | Date    | |

Indexes: `bookingId`, `status`.

---

## Counter (support)
Atomic sequence generator for booking/agreement numbers.

| Field | Type   | Notes |
|-------|--------|-------|
| _id*  | String | e.g. `booking-2026`, `agreement-2026` |
| seq   | Number | incremented via `findOneAndUpdate($inc, upsert)` |

---

## Settings (support, singleton)
Business configuration — replaces hardcoded values.

| Field                | Type   | Notes |
|----------------------|--------|-------|
| businessName         | String | |
| logo                 | Object | { url, publicId } |
| phone / email / whatsapp | String | |
| address              | String | |
| currency             | String | e.g. INR |
| taxRate              | Number | e.g. 0.18 |
| policies             | Object | terms, cancellation, fuel, mileage |
| booking              | Object | { turnoverBufferMinutes, blockingStatuses, minRentalHours, cancellationWindowHours } |
| lateFeePerHour / fuelChargePerUnit | Number | return-charge config |

Single document (`key: 'business'`, unique).
