import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ExternalLink, LogOut, Menu, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES, ROLE_LABELS } from '../../lib/constants';
import { initials } from '../../lib/formatters';
import { cn } from '../../lib/cn';
import { ThemeToggle } from '../ThemeToggle';
import { NotificationBell } from '../NotificationBell';

/**
 * Sticky admin top bar. Hosts the mobile drawer trigger, the theme toggle, a
 * shortcut back to the public storefront, and the account menu (with sign-out).
 */
export function AdminHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setMenuOpen(false), [location.pathname]);

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-hair bg-paper/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-fg transition-colors hover:bg-ink-900/5 lg:hidden dark:hover:bg-white/5"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm font-semibold text-fg-strong sm:inline">Business console</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Link
          to={ROUTES.home}
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-ink-900/5 hover:text-fg-strong sm:inline-flex dark:hover:bg-white/5"
        >
          <ExternalLink className="h-4 w-4" />
          View site
        </Link>

        <NotificationBell />

        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 text-sm font-medium text-fg-strong transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 text-xs font-semibold text-white dark:bg-ink-700">
              {initials(user?.name)}
            </span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-hair bg-card shadow-pop animate-scale-in"
            >
              <div className="border-b border-hair px-4 py-3">
                <p className="truncate text-sm font-semibold text-fg-strong">{user?.name}</p>
                <p className="truncate text-xs text-muted">{ROLE_LABELS[user?.role] || 'Staff'}</p>
              </div>
              <div className="p-1.5">
                <Link
                  to={ROUTES.profile}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5"
                >
                  <UserRound className="h-4 w-4 text-muted" />
                  My profile
                </Link>
                <Link
                  to={ROUTES.home}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-ink-900/5 sm:hidden dark:hover:bg-white/5"
                >
                  <ExternalLink className="h-4 w-4 text-muted" />
                  View site
                </Link>
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
      </div>
    </header>
  );
}
