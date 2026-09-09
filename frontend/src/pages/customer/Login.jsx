import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Car,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login({ email, password });
      toast.success(`Welcome back, ${loggedUser.name}!`);
      if (['OWNER', 'MANAGER', 'STAFF', 'ACCOUNTANT'].includes(loggedUser.role)) {
        navigate('/admin');
      } else {
        navigate(from === '/login' ? '/dashboard' : from);
      }
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (roleKey) => {
    const user = demoLogin(roleKey);
    toast.success(`Signed in as ${user.name} (${user.role})`);
    if (['OWNER', 'MANAGER', 'STAFF', 'ACCOUNTANT'].includes(user.role)) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Car className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome to DriveEasy
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Akash Car Rental Management & Booking Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-900/5 rounded-3xl border border-slate-200/80 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-500" />
              1-Click Demo Logins
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('customer')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all"
              >
                <span className="font-bold text-slate-800 block">Customer</span>
                <span className="text-[10px] text-slate-400">Neha Sharma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('owner')}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100/60 text-left transition-all"
              >
                <span className="font-bold text-amber-900 block flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-600" /> Owner
                </span>
                <span className="text-[10px] text-amber-700">Full Business Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('manager')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all"
              >
                <span className="font-bold text-slate-800 block">Manager</span>
                <span className="text-[10px] text-slate-400">Priya Nair (BLR)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('staff')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all"
              >
                <span className="font-bold text-slate-800 block">Staff</span>
                <span className="text-[10px] text-slate-400">Sana Khan (Check-in)</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

