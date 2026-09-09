# Akash Car Rental Platform (DriveEasy)

A production-ready, full-stack car rental management and online booking platform featuring a customer booking web application, operations management backoffice, and an Express.js / MongoDB REST API backend.

---

## System Architecture

```
Akash car rental/
├── frontend/             # React 18 + Vite + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── api/          # Axios client with JWT interceptors & offline fallback
│   │   ├── components/   # Customer & Admin components, navbars, modals
│   │   ├── context/      # AuthContext (RBAC, demo logins) & ToastContext
│   │   ├── pages/        # Customer storefront & Admin operations hub
│   │   └── utils/        # Constants, formatters (INR ₹, dates)
│   └── dist/             # Production build output
├── backend/              # Express.js REST API
│   ├── src/              # Routes, controllers, services, Mongoose models
│   ├── seed/             # Fictional realistic seed dataset
│   └── tests/            # Deterministic unit and integration test suites
└── docs/                 # System architecture, database schema & API docs
```

---

## Quick Start Guide

### 1. Run the Frontend (Immediate Interactive Preview)

The frontend comes equipped with a rich, realistic fallback dataset so every screen, filter, comparison, and booking flow works out of the box even before the backend database is connected.

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 2. Run the Backend REST API

```bash
cd backend
npm install
# Copy .env.example to .env and configure your MongoDB connection string
cp .env.example .env
# Seed the database with sample locations, fleet, and bookings
npm run seed
# Start the Express server on port 5000
npm run dev
```

Backend API runs at `http://localhost:5000/api`. Vite proxies frontend requests seamlessly to port 5000.

---

## Demo Accounts & Fast Logins

On the login page (`/login`), click any **1-Click Demo Login** button to sign in instantly with test credentials:

| Role | Email | Password | Scope / Permissions |
|------|-------|----------|---------------------|
| **Customer** | `neha@example.com` | `Customer@12345` | Book vehicles, view upcoming trips, download agreements, SOS |
| **Owner** | `owner@example.com` | `Owner@12345` | Full system control, financial analytics, staff management, settings |
| **Manager** | `priya.manager@driveeasy.example` | `Manager@12345` | Fleet inventory, booking lifecycle, inspections, maintenance, coupons |
| **Staff** | `sana.staff@driveeasy.example` | `Staff@12345` | Handover inspections, check-in returns, active bookings, roadside SOS |
| **Accountant** | `vikram.accounts@driveeasy.example` | `Accounts@12345` | Financial ledger, payment records, security deposit refunds |

---

## Key Frontend Routes

### Customer Portal
- `/` — Homepage with Hero search widget, featured fleet, offers banner & customer reviews
- `/cars` — Fleet catalog with multi-faceted filtering (Body type, transmission, fuel, seats, price slider, search)
- `/cars/:id` — Vehicle detail with photo gallery, specs, live quote calculator, reviews & policies
- `/compare` — Side-by-side vehicle comparison matrix (rates, specs, features)
- `/booking` — 4-Step checkout wizard (Schedule review, Add-ons, Promo coupon, Driver KYC, Confirmation)
- `/dashboard` — Customer dashboard with active rentals, agreement PDF download, and roadside SOS
- `/documents` — Driving license and identity verification upload
- `/about`, `/contact`, `/policies` — Informational & policy pages

### Admin Operations Hub (Protected: `/admin`)
- `/admin` — Executive dashboard with real-time KPIs (revenue, fleet utilization %, pickups today)
- `/admin/fleet` — Inventory management, Add vehicle modal, status updater, inter-hub transfer
- `/admin/calendar` — Visual booking timeline & vehicle schedule
- `/admin/bookings` — Booking lifecycle management (Confirm, Handover/Activate, Complete Return, Cancel)
- `/admin/inspections` — Pickup & Return condition checklists with odometer and fuel deficit calculation
- `/admin/damages` — Damage claim logging with repair estimates and deposit deductions
- `/admin/emergencies` — Live 24/7 Roadside SOS dispatch board
- `/admin/payments` — Financial ledger, counter payment recording, deposit refund tracking
- `/admin/maintenance` — Periodic service schedule and Insurance/PUC expiry calendar
- `/admin/customers` — Customer directory with lifetime value & 1-click KYC document review
- `/admin/coupons` — Promotional discount codes configuration
- `/admin/reviews` — Storefront customer review moderation
- `/admin/reports` — Monthly revenue chart, fleet utilization breakdown, and CSV export
- `/admin/staff` — Staff account administration & location assignment (*Owner only*)
- `/admin/settings` — Business profile, GST tax rate, and turnover cleaning buffer (*Owner only*)

