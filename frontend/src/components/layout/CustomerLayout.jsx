import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * Shell for the customer-facing site: sticky navbar, the routed page in a
 * flex-grow main (so short pages still push the footer down), and the footer.
 */
export function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
