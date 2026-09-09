import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { STAFF_ROLES, ROLES } from './utils/constants';

// Layouts
import CustomerLayout from './components/customer/CustomerLayout';
import AdminLayout from './components/admin/AdminLayout';

// Customer Pages
import Home from './pages/customer/Home';
import Fleet from './pages/customer/Fleet';
import VehicleDetail from './pages/customer/VehicleDetail';
import Compare from './pages/customer/Compare';
import BookingCheckout from './pages/customer/BookingCheckout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Documents from './pages/customer/Documents';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import About from './pages/customer/About';
import Contact from './pages/customer/Contact';
import Policies from './pages/customer/Policies';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FleetManagement from './pages/admin/FleetManagement';
import CalendarView from './pages/admin/CalendarView';
import BookingsManagement from './pages/admin/BookingsManagement';
import InspectionsHub from './pages/admin/InspectionsHub';
import DamageReports from './pages/admin/DamageReports';
import EmergencyHub from './pages/admin/EmergencyHub';
import PaymentLedger from './pages/admin/PaymentLedger';
import MaintenanceHub from './pages/admin/MaintenanceHub';
import CustomerManagement from './pages/admin/CustomerManagement';
import CouponManagement from './pages/admin/CouponManagement';
import ReviewModeration from './pages/admin/ReviewModeration';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import StaffManagement from './pages/admin/StaffManagement';
import BusinessSettings from './pages/admin/BusinessSettings';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* ── Public & Customer Portal ────────────────────────── */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/cars" element={<Fleet />} />
              <Route path="/cars/:id" element={<VehicleDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/booking" element={<BookingCheckout />} />

              {/* Protected Customer Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                }
              />

              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/policies" element={<Policies />} />
            </Route>

            {/* Auth Pages without full layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Admin Backoffice Hub ────────────────────────────── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={STAFF_ROLES}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="fleet" element={<FleetManagement />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="bookings" element={<BookingsManagement />} />
              <Route path="inspections" element={<InspectionsHub />} />
              <Route path="damages" element={<DamageReports />} />
              <Route path="emergencies" element={<EmergencyHub />} />
              <Route path="payments" element={<PaymentLedger />} />
              <Route path="maintenance" element={<MaintenanceHub />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="coupons" element={<CouponManagement />} />
              <Route path="reviews" element={<ReviewModeration />} />
              <Route path="reports" element={<ReportsAnalytics />} />

              {/* Owner Only Routes */}
              <Route
                path="staff"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
                    <BusinessSettings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

