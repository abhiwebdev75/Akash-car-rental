import React from 'react';
import { Menu, Bell, MapPin } from 'lucide-react';
import { mockLocations } from '../../api/mockData';

export default function AdminHeader({ title, subtitle, onToggleSidebar, selectedLocation, onSelectLocation }) {
  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Location selector filter */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          <select
            value={selectedLocation || 'ALL'}
            onChange={(e) => onSelectLocation && onSelectLocation(e.target.value)}
            className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Locations (Combined)</option>
            {mockLocations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live operational status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online</span>
        </div>
      </div>
    </header>
  );
}

