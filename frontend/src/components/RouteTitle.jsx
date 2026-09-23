import { matchPath, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/**
 * Sets the browser tab title from the current route. Patterns are matched in
 * order (most specific first), so dynamic routes like `/cars/:id` resolve to a
 * sensible generic title. Mounted once at the app root — no per-page wiring.
 */
const TITLES = [
  // Exact / static routes
  { path: '/', title: 'Home', end: true },
  { path: '/cars', title: 'Browse cars', end: true },
  { path: '/compare', title: 'Compare cars', end: true },
  { path: '/login', title: 'Log in', end: true },
  { path: '/register', title: 'Create account', end: true },
  { path: '/verify-email', title: 'Verify your email', end: true },
  { path: '/forgot-password', title: 'Forgot password', end: true },
  { path: '/reset-password', title: 'Reset password', end: true },
  { path: '/about', title: 'About us', end: true },
  { path: '/contact', title: 'Contact', end: true },
  { path: '/terms', title: 'Terms & conditions', end: true },
  { path: '/privacy', title: 'Privacy policy', end: true },

  // Account (customer)
  { path: '/account', title: 'My bookings', end: true },
  { path: '/account/profile', title: 'Profile & documents', end: true },
  { path: '/account/bookings/:id', title: 'Booking details' },

  // Booking flow
  { path: '/book/:vehicleId', title: 'Book a car' },
  { path: '/booking/confirmed/:id', title: 'Booking confirmed' },

  // Vehicle detail (dynamic — keep after /cars exact)
  { path: '/cars/:id', title: 'Car details' },

  // ── Admin console ──
  { path: '/admin', title: 'Dashboard', end: true },
  { path: '/admin/bookings/new', title: 'New booking', end: true },
  { path: '/admin/bookings/:id', title: 'Booking details' },
  { path: '/admin/bookings', title: 'Bookings', end: true },
  { path: '/admin/calendar', title: 'Calendar', end: true },
  { path: '/admin/maintenance', title: 'Maintenance', end: true },
  { path: '/admin/fleet/new', title: 'Add vehicle', end: true },
  { path: '/admin/fleet/:id/edit', title: 'Edit vehicle' },
  { path: '/admin/fleet', title: 'Fleet', end: true },
  { path: '/admin/customers/:id', title: 'Customer details' },
  { path: '/admin/customers', title: 'Customers', end: true },
  { path: '/admin/staff', title: 'Staff', end: true },
  { path: '/admin/locations', title: 'Locations', end: true },
  { path: '/admin/coupons', title: 'Coupons', end: true },
  { path: '/admin/reports', title: 'Reports & analytics', end: true },
  { path: '/admin/settings', title: 'Business settings', end: true },
];

function resolveTitle(pathname) {
  for (const { path, title, end } of TITLES) {
    if (matchPath({ path, end: end ?? false }, pathname)) return title;
  }
  return ''; // brand-only fallback (e.g. 404)
}

export function RouteTitle() {
  const { pathname } = useLocation();
  useDocumentTitle(resolveTitle(pathname));
  return null;
}
