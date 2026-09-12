import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './PageLoader';
import { ROUTES } from '../lib/constants';

/**
 * Gate for authenticated-only routes. While auth is bootstrapping we show a
 * loader (avoids a flash-redirect on refresh). Unauthenticated users are sent
 * to login with `from` so they return here after signing in.
 * Works as a layout route (<Outlet/>) or wrapping children.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Checking your session" />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
