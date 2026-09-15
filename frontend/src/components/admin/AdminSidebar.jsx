import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../features/settings/hooks';
import { ROLE_LABELS } from '../../lib/constants';
import { initials } from '../../lib/formatters';
import { cn } from '../../lib/cn';
import { Logo } from '../Logo';
import { ADMIN_NAV } from './adminNav';

/**
 * Admin left rail. Renders the role-filtered navigation. Used both as a fixed
 * desktop column and as the contents of the mobile drawer (which passes
 * `onNavigate` to close itself on selection).
 */
export function AdminSidebar({ onNavigate }) {
  const { user, hasRole } = useAuth();
  const { data: settings } = useSettings();
  const businessName = settings?.businessName?.split(' ')[0] || 'Akash';

  const linkClass = ({ isActive }) =>
    cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-ink-900/[0.06] text-fg-strong dark:bg-white/[0.07]'
        : 'text-muted hover:bg-ink-900/[0.04] hover:text-fg-strong dark:hover:bg-white/[0.04]'
    );

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-hair px-5">
        <Logo name={businessName} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group) => {
          const visible = group.items.filter(
            (item) => item.roles.length === 0 || hasRole(...item.roles)
          );
          if (visible.length === 0) return null;

          return (
            <div key={group.section} className="mb-5 last:mb-0">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/80">
                {group.section}
              </p>
              <div className="flex flex-col gap-0.5">
                {visible.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={linkClass}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0 transition-colors',
                            isActive ? 'text-signal' : 'text-muted group-hover:text-fg'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Current user footer */}
      <div className="shrink-0 border-t border-hair p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-800 text-xs font-semibold text-white dark:bg-ink-700">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg-strong">{user?.name}</p>
            <p className="truncate text-xs text-muted">{ROLE_LABELS[user?.role] || 'Staff'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
