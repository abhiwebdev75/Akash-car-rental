import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/admin/StatCard';
import { reportsApi } from '../../api/general.api';
import { bookingsApi } from '../../api/bookings.api';
import { mockDashboardStats, mockBookings, mockMaintenanceAlerts } from '../../api/mockData';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  DollarSign,
  Car,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(mockDashboardStats);
  const [recentBookings, setRecentBookings] = useState(mockBookings);
  const [alerts, setAlerts] = useState(mockMaintenanceAlerts);

  useEffect(() => {
    reportsApi.dashboard().then((data) => {
      if (data) setStats(data);
    });
    bookingsApi.list().then((data) => {
      if (data) setRecentBookings(data.slice(0, 5));
    });
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Top Welcome & KPI row */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Executive Overview
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome back, {user?.name} ({user?.role}). Here is today's real-time operational status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/bookings"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Manage Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Monthly Gross Revenue"
            value={formatCurrency(stats.grossRevenue || 486200)}
            icon={DollarSign}
            trend={14.2}
            trendLabel="vs last month"
            color="emerald"
          />

          <StatCard
            title="Active Fleet Utilization"
            value={`${stats.fleetUtilization || 82.5}%`}
            icon={Activity}
            trend={6.8}
            trendLabel="high demand"
            color="brand"
          />

          <StatCard
            title="Pickups / Returns Today"
            value={`${stats.pickupsToday || 4} / ${stats.returnsToday || 3}`}
            icon={Clock}
            trendLabel="scheduled handovers"
            color="amber"
          />

          <StatCard
            title="Pending KYC Verifications"
            value={stats.pendingKyc || 2}
            icon={ShieldCheck}
            trendLabel="customer documents"
            color="indigo"
          />
        </div>
      </div>

      {/* Fleet Status Breakdown Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Car className="w-4 h-4 text-brand-600" />
            Fleet Availability Distribution (12 Total Fleet)
          </h3>
          <Link to="/admin/fleet" className="text-xs font-bold text-brand-600 hover:text-brand-800">
            View Inventory →
          </Link>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-3 rounded-full bg-slate-100 flex overflow-hidden">
          <div style={{ width: '58%' }} className="bg-emerald-500" title="Available (7)" />
          <div style={{ width: '33%' }} className="bg-brand-500" title="Rented / Booked (4)" />
          <div style={{ width: '9%' }} className="bg-amber-500" title="In Maintenance (1)" />
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Available: <strong>7 vehicles (58%)</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
            <span>On Road / Booked: <strong>4 vehicles (33%)</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Maintenance / Inspection: <strong>1 vehicle (9%)</strong></span>
          </div>
        </div>
      </div>

      {/* 2-Column: Recent Bookings & Urgent Maintenance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              Recent Bookings & Handovers
            </h3>
            <Link to="/admin/bookings" className="text-xs font-bold text-brand-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px] text-xs">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3">Booking #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Pickup Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900">{b.bookingNumber}</td>
                    <td className="py-3 font-medium">{b.customer?.name || 'Customer'}</td>
                    <td className="py-3 font-bold text-slate-900">
                      {b.vehicle?.make} {b.vehicle?.model}
                    </td>
                    <td className="py-3">{formatDate(b.pickupDate)}</td>
                    <td className="py-3 font-bold">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'ACTIVE'
                            ? 'bg-blue-50 text-blue-700'
                            : b.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance & Compliance Alerts (1 Col) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Compliance Watchlist
            </h3>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {alerts.length} Due Soon
            </span>
          </div>

          <div className="space-y-3">
            {alerts.map((al) => (
              <div
                key={al._id}
                className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">
                    {al.type}
                  </span>
                  <span className="font-semibold text-slate-500">Due: {al.dueDate}</span>
                </div>
                <h4 className="font-bold text-slate-900">{al.title}</h4>
                <p className="text-[11px] text-slate-500">
                  {al.vehicle?.make} {al.vehicle?.model} ({al.vehicle?.registrationNumber})
                </p>
              </div>
            ))}

            <Link
              to="/admin/maintenance"
              className="block w-full py-2.5 text-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
            >
              Open Maintenance Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

