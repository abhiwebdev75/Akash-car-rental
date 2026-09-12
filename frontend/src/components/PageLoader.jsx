import { Spinner } from './ui/Spinner';

/**
 * Full-area loading state, used as the Suspense fallback while a lazy page
 * chunk loads. Sized to roughly fill the viewport below the navbar so layout
 * doesn't jump.
 */
export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="h-7 w-7 text-signal" label={label} />
      <p className="text-sm">{label}…</p>
    </div>
  );
}
