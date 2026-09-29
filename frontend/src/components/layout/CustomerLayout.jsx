import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BootGate } from '../BootGate';

/**
 * Shell for the customer-facing site: sticky navbar, the routed page in a
 * flex-grow main (so short pages still push the footer down), and the footer.
 *
 * BootGate holds a branded splash over everything until the critical backend
 * data (settings + locations) is loaded, so the site never paints with empty
 * search dropdowns or half-populated chrome.
 */
export function CustomerLayout() {
  return (
    <BootGate>
      <div className="flex min-h-screen flex-col bg-paper">
        <Navbar />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </BootGate>
  );
}
