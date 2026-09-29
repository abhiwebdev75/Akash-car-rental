import { Logo } from './Logo';
import { Spinner } from './ui/Spinner';

/**
 * Full-screen branded boot screen shown while the app fetches the critical
 * backend data (business settings + locations) the storefront depends on.
 * Prevents the site from painting with empty dropdowns / blank cards.
 */
export function BrandSplash({ name = 'Akash', label = 'Getting things ready' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-paper">
      <div className="animate-scale-in">
        <Logo name={name} as="plain" />
      </div>
      <div className="flex items-center gap-2.5 text-muted">
        <Spinner className="h-5 w-5 text-signal" label={label} />
        <p className="text-sm font-medium">{label}…</p>
      </div>
    </div>
  );
}
