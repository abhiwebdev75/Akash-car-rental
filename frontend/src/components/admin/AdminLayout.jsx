import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const location = useLocation();

  // Determine page title based on route
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/admin') return { title: 'Overview Dashboard', subtitle: 'Live fleet KPIs & operations' };
    if (path.includes('/fleet')) return { title: 'Fleet Inventory', subtitle: 'Vehicle catalog & availability' };
    if (path.includes('/calendar')) return { title: 'Booking Calendar', subtitle: 'Timeline & schedule matrix' };
    if (path.includes('/bookings')) return { title: 'All Bookings', subtitle: 'Reservation lifecycle management' };
    if (path.includes('/inspections')) return { title: 'Vehicle Inspections', subtitle: 'Pickup & return condition checklists' };
    if (path.includes('/damages')) return { title: 'Damage Reports', subtitle: 'Repair cost claims & deductions' };
    if (path.includes('/emergencies')) return { title: 'Emergency Roadside SOS', subtitle: 'Highway breakdown dispatch' };
    if (path.includes('/payments')) return { title: 'Payment Ledger', subtitle: 'Transaction records & deposit refunds' };
    if (path.includes('/maintenance')) return { title: 'Maintenance Hub', subtitle: 'Scheduled service & PUC/insurance compliance' };
    if (path.includes('/customers')) return { title: 'Customer Directory & KYC', subtitle: 'Identity & driver verification' };
    if (path.includes('/coupons')) return { title: 'Coupons & Promos', subtitle: 'Discount code management' };
    if (path.includes('/reviews')) return { title: 'Reviews Moderation', subtitle: 'Storefront review approval' };
    if (path.includes('/reports')) return { title: 'Business Intelligence', subtitle: 'Revenue & fleet utilization analytics' };
    if (path.includes('/staff')) return { title: 'Staff Administration', subtitle: 'Role-based access & location scoping' };
    if (path.includes('/settings')) return { title: 'Platform Settings', subtitle: 'Pricing, policies & turnover buffer' };
    return { title: 'Admin Operations Hub', subtitle: 'Akash Car Rental' };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />

        <main className="flex-1">
          <Outlet context={{ selectedLocation }} />
        </main>
      </div>
    </div>
  );
}

