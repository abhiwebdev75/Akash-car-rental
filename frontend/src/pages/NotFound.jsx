import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../lib/constants';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-ink-200 dark:text-ink-600">404</p>
      <span className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-route/15 text-route">
        <Compass className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-fg-strong">This route doesn’t exist</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you’re looking for may have moved or never existed. Let’s get you back on the road.
      </p>
      <div className="mt-7 flex gap-3">
        <Button to={ROUTES.home} variant="secondary">
          Go home
        </Button>
        <Button to={ROUTES.cars} variant="primary">
          Browse cars
        </Button>
      </div>
      <p className="mt-8 text-xs text-muted">
        Need help?{' '}
        <Link to={ROUTES.contact} className="font-medium text-signal-700 hover:underline dark:text-signal-400">
          Contact us
        </Link>
      </p>
    </div>
  );
}
