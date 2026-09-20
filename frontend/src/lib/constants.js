// Frontend mirror of the backend enums the customer UI needs, plus display
// metadata (labels, badge tones) and the app's route map. Enum VALUES match the
// backend's constants.js exactly so filters and status reads line up. The
// backend remains the source of truth for authorization, pricing and availability.

export const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  ACCOUNTANT: 'ACCOUNTANT',
  CUSTOMER: 'CUSTOMER',
};

export const STAFF_ROLES = [ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.ACCOUNTANT];

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
};

// tone drives the StatusBadge colour. Kept small and semantic.
export const BOOKING_STATUS_META = {
  PENDING: { label: 'Pending', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'info' },
  ACTIVE: { label: 'On rental', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  NO_SHOW: { label: 'No-show', tone: 'muted' },
};

export const PAYMENT_STATUS_META = {
  PENDING: { label: 'Payment pending', tone: 'warning' },
  PARTIAL: { label: 'Part-paid', tone: 'info' },
  PAID: { label: 'Paid', tone: 'success' },
  REFUNDED: { label: 'Refunded', tone: 'muted' },
  FAILED: { label: 'Payment failed', tone: 'danger' },
};

export const VEHICLE_TYPE_LABELS = {
  HATCHBACK: 'Hatchback',
  SEDAN: 'Sedan',
  SUV: 'SUV',
  MUV: 'MUV',
  LUXURY: 'Luxury',
  VAN: 'Van',
};

export const TRANSMISSION_LABELS = { MANUAL: 'Manual', AUTOMATIC: 'Automatic' };

export const FUEL_TYPE_LABELS = {
  PETROL: 'Petrol',
  DIESEL: 'Diesel',
  ELECTRIC: 'Electric',
  HYBRID: 'Hybrid',
  CNG: 'CNG',
};

const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));

export const VEHICLE_TYPE_OPTIONS = toOptions(VEHICLE_TYPE_LABELS);
export const TRANSMISSION_OPTIONS = toOptions(TRANSMISSION_LABELS);
export const FUEL_TYPE_OPTIONS = toOptions(FUEL_TYPE_LABELS);

// Catalog sort options. The '-' prefix means descending (backend getSort convention).
export const SORT_OPTIONS = [
  { value: 'dailyPrice', label: 'Price: low to high' },
  { value: '-dailyPrice', label: 'Price: high to low' },
  { value: 'seats', label: 'Seats: fewest first' },
  { value: '-seats', label: 'Seats: most first' },
];

// Central route map. Functions build parameterised paths.
export const ROUTES = {
  home: '/',
  cars: '/cars',
  vehicle: (id) => `/cars/${id}`,
  compare: '/compare',
  book: (vehicleId) => `/book/${vehicleId}`,
  bookingConfirmed: (id) => `/booking/confirmed/${id}`,
  login: '/login',
  register: '/register',
  verifyEmail: '/verify-email',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  account: '/account',
  accountBooking: (id) => `/account/bookings/${id}`,
  profile: '/account/profile',
  about: '/about',
  contact: '/contact',
  terms: '/terms',
  privacy: '/privacy',

  // ── Admin / business dashboard (staff only) ──
  admin: '/admin',
  adminBookings: '/admin/bookings',
  adminBookingNew: '/admin/bookings/new',
  adminBooking: (id) => `/admin/bookings/${id}`,
  adminCalendar: '/admin/calendar',
  adminFleet: '/admin/fleet',
  adminVehicleNew: '/admin/fleet/new',
  adminVehicleEdit: (id) => `/admin/fleet/${id}/edit`,
  adminMaintenance: '/admin/maintenance',
  adminCustomers: '/admin/customers',
  adminCustomer: (id) => `/admin/customers/${id}`,
  adminStaff: '/admin/staff',
  adminLocations: '/admin/locations',
  adminCoupons: '/admin/coupons',
  adminReports: '/admin/reports',
  adminSettings: '/admin/settings',
};

// ── RBAC role tiers (mirror the backend guards) ──────────────────────────────
// Used to gate admin routes and hide sidebar links. The backend still enforces
// authorization on every request; this is UX only.
export const MANAGER_UP = [ROLES.OWNER, ROLES.MANAGER];
export const STAFF_UP = [ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF];
export const FINANCE_ROLES = [ROLES.OWNER, ROLES.MANAGER, ROLES.ACCOUNTANT];
export const OWNER_ONLY = [ROLES.OWNER];

export const ROLE_LABELS = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  STAFF: 'Staff',
  ACCOUNTANT: 'Accountant',
  CUSTOMER: 'Customer',
};

// Roles an owner can assign to a staff account (never CUSTOMER — customers self-register).
export const STAFF_ROLE_OPTIONS = [ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.ACCOUNTANT].map(
  (r) => ({ value: r, label: ROLE_LABELS[r] })
);

// ── User status ──
export const USER_STATUS = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' };
export const USER_STATUS_META = {
  ACTIVE: { label: 'Active', tone: 'success' },
  INACTIVE: { label: 'Inactive', tone: 'muted' },
};
export const USER_STATUS_LABELS = { ACTIVE: 'Active', INACTIVE: 'Inactive' };
export const USER_STATUS_OPTIONS = toOptions(USER_STATUS_LABELS);

// ── Vehicle status (current-state snapshot for the fleet dashboard) ──
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  RENTED: 'RENTED',
  MAINTENANCE: 'MAINTENANCE',
  RESERVED: 'RESERVED',
  INACTIVE: 'INACTIVE',
};
export const VEHICLE_STATUS_LABELS = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  RENTED: 'On rental',
  MAINTENANCE: 'Maintenance',
  RESERVED: 'Reserved',
  INACTIVE: 'Inactive',
};
export const VEHICLE_STATUS_META = {
  AVAILABLE: { label: 'Available', tone: 'success' },
  BOOKED: { label: 'Booked', tone: 'info' },
  RENTED: { label: 'On rental', tone: 'warning' },
  MAINTENANCE: { label: 'Maintenance', tone: 'danger' },
  RESERVED: { label: 'Reserved', tone: 'info' },
  INACTIVE: { label: 'Inactive', tone: 'muted' },
};
// Statuses an admin can set directly on the vehicle form (lifecycle states like
// BOOKED/RENTED are driven by bookings, not hand-set).
export const VEHICLE_STATUS_FORM_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'INACTIVE', label: 'Inactive' },
];
export const VEHICLE_STATUS_FILTER_OPTIONS = toOptions(VEHICLE_STATUS_LABELS);

// ── Booking status (filter dropdown) ──
export const BOOKING_STATUS_OPTIONS = Object.entries(BOOKING_STATUS_META).map(
  ([value, meta]) => ({ value, label: meta.label })
);

// ── Maintenance ──
export const MAINTENANCE_TYPE_LABELS = {
  SERVICE: 'General service',
  OIL_CHANGE: 'Oil change',
  TYRE_REPLACEMENT: 'Tyre replacement',
  BRAKE_SERVICE: 'Brake service',
  REPAIR: 'Repair',
  INSURANCE: 'Insurance renewal',
  PUC: 'PUC renewal',
  OTHER: 'Other',
};
export const MAINTENANCE_TYPE_OPTIONS = toOptions(MAINTENANCE_TYPE_LABELS);
export const MAINTENANCE_STATUS_META = {
  SCHEDULED: { label: 'Scheduled', tone: 'info' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'muted' },
};
export const MAINTENANCE_STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
export const MAINTENANCE_STATUS_OPTIONS = toOptions(MAINTENANCE_STATUS_LABELS);

// ── Notifications ──
// Audience decides which side deep-links point at (admin console vs. account),
// and `tone` maps to the accent dot in the inbox. `label` is a fallback title.
export const NOTIFICATION_AUDIENCE = { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN' };
export const NOTIFICATION_TYPE_META = {
  NEW_BOOKING: { label: 'New booking', tone: 'info' },
  BOOKING_CONFIRMED: { label: 'Booking confirmed', tone: 'success' },
  BOOKING_CANCELLED: { label: 'Booking cancelled', tone: 'danger' },
  PAYMENT_RECEIVED: { label: 'Payment received', tone: 'success' },
  PAYMENT_PENDING: { label: 'Payment pending', tone: 'warning' },
  PICKUP_REMINDER: { label: 'Pickup reminder', tone: 'info' },
  RETURN_REMINDER: { label: 'Return reminder', tone: 'info' },
  AGREEMENT_GENERATED: { label: 'Agreement ready', tone: 'info' },
  VEHICLE_RETURN: { label: 'Vehicle returned', tone: 'info' },
  DAMAGE_REPORTED: { label: 'Damage reported', tone: 'danger' },
  EMERGENCY: { label: 'Emergency', tone: 'danger' },
};

// ── Coupons ──
export const COUPON_TYPE = { PERCENTAGE: 'PERCENTAGE', FIXED: 'FIXED' };
export const COUPON_TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
  { value: 'FIXED', label: 'Fixed amount' },
];

// ── Payments ──
export const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank transfer',
  ONLINE: 'Online',
  OTHER: 'Other',
};
export const PAYMENT_METHOD_OPTIONS = toOptions(PAYMENT_METHOD_LABELS);
export const PAYMENT_KIND_LABELS = {
  RENTAL: 'Rental',
  DEPOSIT: 'Security deposit',
  DEPOSIT_REFUND: 'Deposit refund',
  EXTRA_CHARGES: 'Extra charges',
  REFUND: 'Refund',
};
// Kinds a staff member can record as money coming IN.
export const PAYMENT_INFLOW_KIND_OPTIONS = [
  { value: 'RENTAL', label: 'Rental' },
  { value: 'DEPOSIT', label: 'Security deposit' },
  { value: 'EXTRA_CHARGES', label: 'Extra charges' },
];
// Kinds allowed on the refund endpoint (money OUT).
export const PAYMENT_REFUND_KIND_OPTIONS = [
  { value: 'REFUND', label: 'Rental refund' },
  { value: 'DEPOSIT_REFUND', label: 'Deposit refund' },
];
