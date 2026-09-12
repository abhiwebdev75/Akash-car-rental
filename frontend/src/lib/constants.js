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
  account: '/account',
  accountBooking: (id) => `/account/bookings/${id}`,
  profile: '/account/profile',
  about: '/about',
  contact: '/contact',
  terms: '/terms',
  privacy: '/privacy',
};
