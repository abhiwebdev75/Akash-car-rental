import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { RouteProgress } from './components/RouteProgress';
import { PageLoader } from './components/PageLoader';

// Lazy-load pages so each becomes its own chunk — the landing page stays light
// and authenticated/booking screens only load when needed.
const Home = lazy(() => import('./pages/Home'));
const Cars = lazy(() => import('./pages/Cars'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const Compare = lazy(() => import('./pages/Compare'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
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

export default function App() {
  return (
    <>
      <ScrollToTop />
      <RouteProgress />
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
        </Routes>
      </Suspense>
    </>
  );
}
