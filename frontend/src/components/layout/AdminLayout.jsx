import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { AdminSidebar } from '../admin/AdminSidebar';
import { AdminHeader } from '../admin/AdminHeader';

/**
 * Shell for the business console: a fixed sidebar on large screens, a slide-in
 * drawer on small screens, and a sticky header above the scrolling content.
 * Fully theme-aware via the semantic tokens (paper/surface/card/hair/fg).
 */
export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Fixed desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-hair lg:block">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink-900/50 backdrop-blur-sm transition-opacity duration-200',
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-hair shadow-pop transition-transform duration-200',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="absolute right-3 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink-900/5 hover:text-fg-strong dark:hover:bg-white/5"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* Content column */}
      <div className="lg:pl-64">
        <AdminHeader onMenuClick={() => setDrawerOpen(true)} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
