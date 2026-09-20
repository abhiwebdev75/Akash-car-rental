import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { cn } from '../../lib/cn';

/**
 * Admin shell: a fixed left rail on desktop, a slide-over drawer on mobile, and
 * a sticky top bar. Theme-aware throughout (semantic tokens, no hardcoded
 * colours). Child routes render into the <Outlet/>.
 */
export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-paper text-fg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-hair lg:block">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink-900/40 backdrop-blur-sm transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[80%] border-r border-hair shadow-pop transition-transform duration-200',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg transition-colors hover:bg-ink-900/5 dark:hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
          <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <AdminHeader onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
