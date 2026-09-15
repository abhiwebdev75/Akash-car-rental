import {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  Car,
  Wrench,
  Users,
  UserCog,
  MapPin,
  TicketPercent,
  BarChart3,
  Settings,
} from 'lucide-react';
import { ROUTES, MANAGER_UP, STAFF_UP, FINANCE_ROLES } from '../../lib/constants';

/**
 * Single source of truth for the admin navigation. `roles` mirrors the backend
 * guard for the primary endpoint each page depends on, so a user never sees a
 * link that would 403 on load. An empty `roles` array means "any staff member".
 * The backend still enforces authorization on every request; this is UX only.
 *
 * `end` marks routes that should match exactly (the Dashboard index) so they
 * don't stay highlighted on nested paths.
 */
export const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [
      { to: ROUTES.admin, label: 'Dashboard', icon: LayoutDashboard, end: true, roles: [] },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: ROUTES.adminBookings, label: 'Bookings', icon: CalendarRange, roles: STAFF_UP },
      { to: ROUTES.adminCalendar, label: 'Calendar', icon: CalendarDays, roles: STAFF_UP },
      { to: ROUTES.adminFleet, label: 'Fleet', icon: Car, roles: MANAGER_UP },
      { to: ROUTES.adminMaintenance, label: 'Maintenance', icon: Wrench, roles: STAFF_UP },
    ],
  },
  {
    section: 'People',
    items: [
      { to: ROUTES.adminCustomers, label: 'Customers', icon: Users, roles: MANAGER_UP },
      { to: ROUTES.adminStaff, label: 'Team', icon: UserCog, roles: MANAGER_UP },
    ],
  },
  {
    section: 'Business',
    items: [
      { to: ROUTES.adminLocations, label: 'Locations', icon: MapPin, roles: MANAGER_UP },
      { to: ROUTES.adminCoupons, label: 'Coupons', icon: TicketPercent, roles: MANAGER_UP },
      { to: ROUTES.adminReports, label: 'Reports', icon: BarChart3, roles: FINANCE_ROLES },
      { to: ROUTES.adminSettings, label: 'Settings', icon: Settings, roles: MANAGER_UP },
    ],
  },
];
