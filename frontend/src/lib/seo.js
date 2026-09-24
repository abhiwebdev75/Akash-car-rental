/**
 * Central SEO configuration for Akash Car Rental.
 *
 * SITE.url is the production origin — it's used to build canonical URLs, the
 * sitemap, and Open Graph/Twitter link tags. Set VITE_SITE_URL in your
 * environment (e.g. VITE_SITE_URL=https://www.akashcarrental.com) so these
 * point at the real domain; the fallback below is a placeholder ONLY.
 *
 * Business NAP (name/address/phone) here MUST stay identical to what's shown on
 * the Contact page and in the JSON-LD in index.html — consistent NAP across the
 * site and Google Business Profile is one of the strongest local-SEO signals.
 */
export const SITE = {
  name: 'Akash Car Rental',
  // Trailing slash intentionally omitted; helpers add paths directly.
  url: (import.meta.env?.VITE_SITE_URL || 'https://www.akashcarrental.com').replace(/\/$/, ''),
  locale: 'en_IN',
  twitter: '', // add @handle if/when there's a Twitter/X account
  defaultImage: '/og-image.jpg', // 1200x630 social card placed in /public
  description:
    'Self-drive car rental in Kharar, Mohali, Chandigarh and Hamirpur (HP). Book a well-maintained car online in minutes with live availability and transparent, all-inclusive pricing.',
};

// Cities/regions the business serves — used in structured data and page copy.
export const SERVICE_AREAS = [
  { city: 'Kharar', region: 'Punjab' },
  { city: 'Mohali', region: 'Punjab' },
  { city: 'Chandigarh', region: 'Chandigarh' },
  { city: 'Hamirpur', region: 'Himachal Pradesh' },
];

// Keep in lockstep with Contact.jsx and index.html JSON-LD.
export const BUSINESS = {
  streetAddress: 'Near Bhagomajra Toll Plaza',
  city: 'Kharar',
  region: 'Punjab',
  postalCode: '140301',
  country: 'IN',
  latitude: 30.7460,
  longitude: 76.6469,
  phones: ['+91-7876573193', '+91-9816523804'],
};

const AREAS_PHRASE = 'Kharar, Mohali, Chandigarh & Hamirpur (HP)';

/**
 * Per-route SEO metadata. Patterns mirror RouteTitle; matched most-specific
 * first. `title` is the page name (brand is appended), `description` is the
 * meta description. Dynamic routes get sensible generic copy.
 */
export const ROUTE_SEO = [
  {
    path: '/',
    end: true,
    title: 'Self-drive car rental in Kharar, Mohali & Chandigarh',
    description: SITE.description,
  },
  {
    path: '/cars',
    end: true,
    title: 'Browse cars for rent',
    description: `See every self-drive car available for hire across ${AREAS_PHRASE}. Live availability, real photos and transparent daily pricing.`,
  },
  {
    path: '/cars/:id',
    title: 'Car details',
    description: `Full specs, photos and daily rental price for this self-drive car. Check availability and book online with ${SITE.name}.`,
  },
  {
    path: '/compare',
    end: true,
    title: 'Compare cars',
    description: 'Compare self-drive rental cars side by side on price, seats, fuel and transmission to find the right one for your trip.',
  },
  {
    path: '/about',
    end: true,
    title: 'About us',
    description: `${SITE.name} is a local self-drive car rental service based in Kharar, serving Mohali, Chandigarh and Hamirpur (HP) with a well-maintained, fairly priced fleet.`,
  },
  {
    path: '/contact',
    end: true,
    title: 'Contact & pickup location',
    description: `Call or message ${SITE.name} in Kharar, Punjab. Find our pickup location, phone numbers and hours for self-drive car rental near you.`,
  },
  { path: '/login', end: true, title: 'Log in', description: `Log in to your ${SITE.name} account to manage bookings.`, noindex: true },
  { path: '/register', end: true, title: 'Create account', description: `Create a ${SITE.name} account to book self-drive cars online.`, noindex: true },
  { path: '/verify-email', end: true, title: 'Verify your email', noindex: true },
  { path: '/forgot-password', end: true, title: 'Forgot password', noindex: true },
  { path: '/reset-password', end: true, title: 'Reset password', noindex: true },
  { path: '/terms', end: true, title: 'Terms & conditions', description: `The terms and conditions for renting a self-drive car from ${SITE.name}.` },
  { path: '/privacy', end: true, title: 'Privacy policy', description: `How ${SITE.name} collects, uses and protects your personal information.` },

  // Authenticated / booking — keep out of the index.
  { path: '/account', end: true, title: 'My bookings', noindex: true },
  { path: '/account/profile', end: true, title: 'Profile & documents', noindex: true },
  { path: '/account/bookings/:id', title: 'Booking details', noindex: true },
  { path: '/book/:vehicleId', title: 'Book a car', noindex: true },
  { path: '/booking/confirmed/:id', title: 'Booking confirmed', noindex: true },
];
