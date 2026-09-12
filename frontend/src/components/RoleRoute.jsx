import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './PageLoader';
import { ROUTES } from '../lib/constants';

/**
 * Gate for routes restricted to specific roles (e.g. staff-only areas).
 * `roles` is a list of allowed role codes. Unauthenticated → login;
 * authenticated-but-wrong-role → `fallback` path (defaults home).
 * The backend still enforces authorization; this is UX only.
 */
export function RoleRoute({ roles = [], fallback = ROUTES.home, children }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Checking access" />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to={fallback} replace />;
  }

  return children ?? <Outlet />;
}
