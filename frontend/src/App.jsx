import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { RouteProgress } from './components/RouteProgress';
import { RouteTitle } from './components/RouteTitle';
import { PageLoader } from './components/PageLoader';
import { ROUTES, STAFF_ROLES, STAFF_UP, MANAGER_UP, FINANCE_ROLES } from './lib/constants';

// Lazy-load pages so each becomes its own chunk — the landing page stays light
// and authenticated/booking screens only load when needed.
const Home = lazy(() => import('./pages/Home'));
const Cars = lazy(() => import('./pages/Cars'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const Compare = lazy(() => import('./pages/Compare'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Booking = lazy(() => import('./pages/Booking'));
const BookingConfirmed = lazy(() => import('./pages/BookingConfirmed'));
const Account = lazy(() => import('./pages/Account'));
const AccountBooking = lazy(() => import('./pages/AccountBooking'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ── Admin (staff-only). Its own layout + chunk, lazy-loaded so none of it
// ships to customers. ──
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const BookingsManagement = lazy(() => import('./pages/admin/BookingsManagement'));
const BookingCreate = lazy(() => import('./pages/admin/BookingCreate'));
const BookingDetail = lazy(() => import('./pages/admin/BookingDetail'));
const CalendarView = lazy(() => import('./pages/admin/CalendarView'));
const FleetManagement = lazy(() => import('./pages/admin/FleetManagement'));
const VehicleForm = lazy(() => import('./pages/admin/VehicleForm'));
const MaintenanceHub = lazy(() => import('./pages/admin/MaintenanceHub'));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement'));
const CustomerDetail = lazy(() => import('./pages/admin/CustomerDetail'));
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'));
const LocationManagement = lazy(() => import('./pages/admin/LocationManagement'));
const CouponManagement = lazy(() => import('./pages/admin/CouponManagement'));
const ReportsAnalytics = lazy(() => import('./pages/admin/ReportsAnalytics'));
const BusinessSettings = lazy(() => import('./pages/admin/BusinessSettings'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <RouteProgress />
      <RouteTitle />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<CustomerLayout />}>
            {/* Public */}
            <Route index element={<Home />} />
            <Route path="cars" element={<Cars />} />
            <Route path="cars/:id" element={<VehicleDetail />} />
            <Route path="compare" element={<Compare />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />

            {/* Authenticated (booking is login-gated — even /quote requires auth) */}
            <Route element={<ProtectedRoute />}>
              <Route path="book/:vehicleId" element={<Booking />} />
              <Route path="booking/confirmed/:id" element={<BookingConfirmed />} />
              <Route path="account" element={<Account />} />
              <Route path="account/bookings/:id" element={<AccountBooking />} />
              <Route path="account/profile" element={<Profile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* ── Admin dashboard (staff only) ──
              Outer gate: any staff role may enter the shell. Inner gates match
              each page's backend guard so a link never lands on a 403. The
              backend still authorizes every request — this is UX only. */}
          <Route
            path="admin"
            element={
              <RoleRoute roles={STAFF_ROLES} fallback={ROUTES.home}>
                <AdminLayout />
              </RoleRoute>
            }
          >
            <Route index element={<AdminDashboard />} />

            {/* Operations */}
            <Route element={<RoleRoute roles={STAFF_UP} />}>
              <Route path="bookings" element={<BookingsManagement />} />
              <Route path="bookings/:id" element={<BookingDetail />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="maintenance" element={<MaintenanceHub />} />
            </Route>

            {/* Manager+ operations */}
            <Route element={<RoleRoute roles={MANAGER_UP} />}>
              <Route path="bookings/new" element={<BookingCreate />} />
              <Route path="fleet" element={<FleetManagement />} />
              <Route path="fleet/new" element={<VehicleForm />} />
              <Route path="fleet/:id/edit" element={<VehicleForm />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="locations" element={<LocationManagement />} />
              <Route path="coupons" element={<CouponManagement />} />
            </Route>

            {/* Finance (reports read by owner/manager/accountant) */}
            <Route element={<RoleRoute roles={FINANCE_ROLES} />}>
              <Route path="reports" element={<ReportsAnalytics />} />
            </Route>

            {/* Settings: viewable by manager+; edits are owner-gated in-page. */}
            <Route element={<RoleRoute roles={MANAGER_UP} />}>
              <Route path="settings" element={<BusinessSettings />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
