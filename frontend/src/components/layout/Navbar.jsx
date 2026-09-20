import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  UserCircle,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../features/settings/hooks';
import { useCompare } from '../../lib/useCompare';
import { ROUTES } from '../../lib/constants';
import { initials } from '../../lib/formatters';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ThemeToggle';
import { NotificationBell } from '../NotificationBell';
import { Logo } from '../Logo';

const NAV_LINKS = [
  { to: ROUTES.cars, label: 'Cars' },
  { to: ROUTES.compare, label: 'Compare' },
  { to: ROUTES.about, label: 'About' },
  { to: ROUTES.contact, label: 'Contact' },
];

export function Navbar() {
  const { data: settings } = useSettings();
  const { isAuthenticated, user, logout } = useAuth();
  const { count: compareCount } = useCompare();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const businessName = settings?.businessName?.split(' ')[0] || 'Akash';

  // Close menus on route change.
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Close account dropdown on outside click.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.home);
  };

  const linkClass = ({ isActive }) =>
    cn(
      'relative text-sm font-medium transition-colors hover:text-fg-strong',
      isActive ? 'text-fg-strong' : 'text-muted'
    );

  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-paper/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo name={businessName} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {({ isActive }) => (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    {link.label}
                    {link.to === ROUTES.compare && compareCount > 0 && (
                      <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-signal px-1 text-[10px] font-bold leading-none text-ink-900">
                        {compareCount}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-[21px] left-0 h-0.5 w-full bg-signal" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {isAuthenticated && <NotificationBell />}

          <ThemeToggle />

          {isAuthenticated ? (
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-fg-strong transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 text-xs font-semibold text-white dark:bg-ink-700">
                  {initials(user?.name)}
                </span>
                <span className="max-w-[8rem] truncate">{user?.name?.split(' ')[0]}</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-hair bg-card shadow-pop animate-scale-in"
                >
                  <div className="border-b border-hair px-4 py-3">
                    <p className="truncate text-sm font-semibold text-fg-strong">{user?.name}</p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <MenuItem to={ROUTES.account} icon={CalendarDays}>
                      My bookings
                    </MenuItem>
                    <MenuItem to={ROUTES.profile} icon={UserRound}>
                      Profile & documents
                    </MenuItem>
                  </div>
                  <div className="border-t border-hair p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button to={ROUTES.login} variant="ghost" size="sm">
                Log in
              </Button>
              <Button to={ROUTES.register} variant="primary" size="sm">
                Sign up
              </Button>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-fg transition-colors hover:bg-ink-900/5 md:hidden dark:hover:bg-white/5"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-hair bg-paper md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ink-900/5 text-fg-strong dark:bg-white/5'
                      : 'text-muted hover:bg-ink-900/5 dark:hover:bg-white/5'
                  )
                }
              >
                <span>{link.label}</span>
                {link.to === ROUTES.compare && compareCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-signal px-1 text-xs font-bold leading-none text-ink-900">
                    {compareCount}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="my-2 h-px bg-hair" />

            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-xs font-semibold text-white dark:bg-ink-700">
                    {initials(user?.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg-strong">{user?.name}</p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                  </div>
                </div>
                <MobileLink to={ROUTES.account} icon={CalendarDays}>
                  My bookings
                </MobileLink>
                <MobileLink to={ROUTES.profile} icon={UserRound}>
                  Profile & documents
                </MobileLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-1 py-1">
                <Button to={ROUTES.login} variant="secondary" fullWidth leftIcon={<UserCircle className="h-4 w-4" />}>
                  Log in
                </Button>
                <Button to={ROUTES.register} variant="primary" fullWidth>
                  Create account
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuItem({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5"
    >
      <Icon className="h-4 w-4 text-muted" />
      {children}
    </Link>
  );
}

function MobileLink({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5"
    >
      <Icon className="h-4 w-4 text-muted" />
      {children}
    </Link>
  );
}
