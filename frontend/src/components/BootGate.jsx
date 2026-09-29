import { useLocations } from '../features/locations/hooks';
import { useSettings } from '../features/settings/hooks';
import { BrandSplash } from './BrandSplash';

/**
 * Holds back the storefront until the data the whole site leans on is in the
 * cache: business settings (branding, currency) and locations (search widget,
 * dropdowns). Both are long-lived and fetched once, so this only gates the very
 * first paint — subsequent navigation reads from cache instantly.
 *
 * A query settling into an *error* also lifts the gate (isLoading → false), so a
 * backend hiccup never traps the user on the splash forever; pages then handle
 * their own empty/error states.
 */
export function BootGate({ children }) {
  const locations = useLocations();
  const settings = useSettings();

  const booting = locations.isLoading || settings.isLoading;
  if (booting) {
    return <BrandSplash name={settings.data?.businessName?.split(' ')[0]} />;
  }

  return children;
}
