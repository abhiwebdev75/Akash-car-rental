import { Construction } from 'lucide-react';
import { Button } from './ui/Button';
import { ROUTES } from '../lib/constants';

/**
 * Intentional-looking placeholder used by page stubs during Phase 1 so the app
 * runs end-to-end (routing, layout, theme) before each real page is built.
 * Replaced screen-by-screen in Phase 2.
 */
export function PagePlaceholder({ title, blurb }) {
  return (
    <div className="container-page flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-signal/15 text-signal-700 dark:text-signal-300">
        <Construction className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-bold text-fg-strong">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        {blurb || 'This page is part of the build and is coming together shortly.'}
      </p>
      <div className="mt-6 flex gap-3">
        <Button to={ROUTES.home} variant="secondary" size="sm">
          Back home
        </Button>
        <Button to={ROUTES.cars} variant="primary" size="sm">
          Browse cars
        </Button>
      </div>
    </div>
  );
}
