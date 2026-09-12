import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll to top on every route change (SPA doesn't do this by default).
 * Skips when navigating to an in-page hash so anchor links still work.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname, hash]);

  return null;
}
