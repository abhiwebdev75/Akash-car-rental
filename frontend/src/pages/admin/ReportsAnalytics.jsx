import React from 'react';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  Car,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function ReportsAnalytics() {
  const toast = useToast();

  const monthlyRevenue = [
    { month: 'Apr', revenue: 380000, bookings: 42 },
    { month: 'May', revenue: 420000, bookings: 49 },
    { month: 'Jun', revenue: 460000, bookings: 53 },
    { month: 'Jul', revenue: 410000, bookings: 46 },
    { month: 'Aug', revenue: 490000, bookings: 58 },
    { month: 'Sep', revenue: 486200, bookings: 54 },
  ];

  const locationPerformance = [
    { hub: 'Bengaluru — Indiranagar', fleet: 8, utilization: 86, revenue: 352000 },
    { hub: 'Mysuru — City Centre', fleet: 4, utilization: 75, revenue: 134200 },
  ];

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Month,Gross Revenue (INR),Total Bookings\n' +
      monthlyRevenue.map((r) => `${r.month},${r.revenue},${r.bookings}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Akash_Car_Rental_Revenue_Report_2026.csv');
    document.body.appendChild(link);
    link.click();
    toast.success('Downloaded Revenue CSV Report!');
  };

  const maxRev = Math.max(...monthlyRevenue.map((m) => m.revenue));

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Business Intelligence & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet utilization rates, gross margins, location revenue comparisons, and financial statements.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Revenue Trend Chart Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Monthly Gross Revenue Trend</h3>
            <p className="text-xs text-slate-400">Past 6 months revenue performance (in INR)</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl">
            <TrendingUp className="w-4 h-4" />
            <span>+14.2% Growth</span>
          </div>
        </div>

        {/* Custom Visual Bar Chart */}
        <div className="grid grid-cols-6 gap-4 items-end h-56 pt-8 pb-2 border-b border-slate-100">
          {monthlyRevenue.map((item) => {
            const heightPercent = Math.round((item.revenue / maxRev) * 100);
            return (
              <div key={item.month} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                  {formatCurrency(item.revenue)}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[48px] rounded-2xl bg-gradient-to-t from-brand-600 to-brand-400 group-hover:from-brand-700 group-hover:to-brand-500 transition-all shadow-sm"
                />
                <span className="text-xs font-bold text-slate-700 mt-3">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hub Location Performance */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Hub Location Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locationPerformance.map((hub) => (
            <div
              key={hub.hub}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">{hub.hub}</h4>
                </div>
                <span className="text-xs font-bold text-brand-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {hub.fleet} Cars Assigned
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">Fleet Utilization</span>
                  <span className="text-lg font-black text-slate-900">{hub.utilization}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">September Revenue</span>
                  <span className="text-lg font-black text-slate-900">{formatCurrency(hub.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

