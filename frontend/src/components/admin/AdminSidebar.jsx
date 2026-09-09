import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  Calendar,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Wrench,
  Users,
  Tag,
  MessageSquare,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  LifeBuoy,
} from 'lucide-react';

export default function AdminSidebar({ isOpen, onClose }) {
  const { user, isOwner, isManager, isAccountant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Fleet Inventory', path: '/admin/fleet', icon: Car },
    { label: 'Booking Calendar', path: '/admin/calendar', icon: Calendar },
    { label: 'All Bookings', path: '/admin/bookings', icon: ClipboardList },
    { label: 'Inspections', path: '/admin/inspections', icon: CheckCircle2 },
    { label: 'Damage Reports', path: '/admin/damages', icon: AlertTriangle },
    { label: 'Emergency SOS', path: '/admin/emergencies', icon: LifeBuoy },
    { label: 'Payments & Refunds', path: '/admin/payments', icon: CreditCard },
    { label: 'Maintenance Hub', path: '/admin/maintenance', icon: Wrench },
    { label: 'Customer KYC', path: '/admin/customers', icon: Users },
    { label: 'Coupons & Promos', path: '/admin/coupons', icon: Tag },
    { label: 'Review Moderation', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Analytics & Reports', path: '/admin/reports', icon: BarChart3 },
    ...(isOwner ? [{ label: 'Staff Management', path: '/admin/staff', icon: UserCheck }] : []),
    ...(isOwner ? [{ label: 'System Settings', path: '/admin/settings', icon: Settings }] : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block leading-tight">
                Drive<span className="text-brand-400">Easy</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                ADMIN HUB
              </span>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User Profile & Switcher */}
        <div className="p-4 border-t border-slate-800 shrink-0 space-y-3 bg-slate-950/40">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-brand-400" />
              <span>Customer Site</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400 shrink-0">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <span className="inline-block text-[10px] font-semibold text-amber-400 tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

