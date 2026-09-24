import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Car,
  Clock,
  Fuel,
  Headphones,
  KeyRound,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { SearchWidget } from '../components/SearchWidget';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { HeroCarousel } from '../components/HeroCarousel';
import { Marquee } from '../components/Marquee';
import { LazySection } from '../components/LazySection';
import { VehicleCard, VehicleCardSkeleton } from '../features/vehicles/VehicleCard';
import { useVehicles } from '../features/vehicles/hooks';
import { useSettings } from '../features/settings/hooks';
import { ROUTES } from '../lib/constants';
import { SERVICE_AREAS } from '../lib/seo';

const VALUE_PROPS = [
  { icon: Wallet, title: 'Transparent pricing', text: 'The price you see is the price you pay — taxes and deposit shown up front.' },
  { icon: ShieldCheck, title: 'Well-maintained fleet', text: 'Every car is serviced and inspected between rentals.' },
  { icon: MapPin, title: 'Convenient pickup', text: 'Collect from a location near you, when it suits your schedule.' },
  { icon: CalendarCheck, title: 'Booked in minutes', text: 'Real-time availability and instant confirmation — no phone calls.' },
];

const STEPS = [
  { icon: MapPin, title: 'Search', text: 'Pick your location and dates.' },
  { icon: Car, title: 'Choose', text: 'Compare cars available for your trip.' },
  { icon: CalendarCheck, title: 'Book', text: 'Confirm with a clear, itemised quote.' },
  { icon: KeyRound, title: 'Drive', text: 'Collect the keys and hit the road.' },
];

// Trust signals for the scrolling marquee band.
const MARQUEE_ITEMS = [
  { icon: ShieldCheck, text: 'Fully insured vehicles' },
  { icon: Clock, text: '24/7 roadside assistance' },
  { icon: Fuel, text: 'Flexible fuel options' },
  { icon: Sparkles, text: 'Sanitised between rentals' },
  { icon: Wallet, text: 'No hidden charges' },
  { icon: Headphones, text: 'Friendly local support' },
  { icon: CalendarCheck, text: 'Free date changes' },
];

/** Build carousel slides from featured vehicles' primary images. */
function toSlides(vehicles) {
  return (vehicles || [])
    .map((v) => {
      const p = v?.primaryImage;
      const url =
        (typeof p === 'string' && p) ||
        p?.url ||
        (v?.images || []).find((i) => i.isPrimary)?.url ||
        (v?.images || [])[0]?.url ||
        null;
      return url ? { url } : null;
    })
    .filter(Boolean)
    .slice(0, 5);
}

export default function Home() {
  const { data: settings } = useSettings();
  const { data, isLoading, isError, error, refetch } = useVehicles({ limit: 6 });
  const featured = data?.items || [];
  const businessName = settings?.businessName || 'Akash Car Rental';
  const slides = toSlides(featured);

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-hair bg-ink-900">
        {slides.length > 0 ? <HeroCarousel slides={slides} /> : <HeroBackdrop />}
        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-route" />
              Self-drive car rental
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your next drive,
              <br />
              <span className="text-signal">booked in minutes.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Choose from a well-kept fleet, see real-time availability, and get an honest,
              itemised price before you commit. No queues, no surprises.
            </p>
          </div>

          <div className="mt-9 max-w-4xl animate-scale-in">
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* ---------- Trust marquee ---------- */}
      <section className="border-b border-hair bg-surface py-3">
        <Marquee>
          {MARQUEE_ITEMS.map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-2.5 text-sm font-semibold text-fg">
              <Icon className="h-4 w-4 text-route" />
              {text}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ---------- Value props ---------- */}
      <section className="container-page py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-route/12 text-route">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-fg-strong">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Featured vehicles ---------- */}
      <section className="container-page pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">
              Popular right now
            </h2>
            <p className="mt-1.5 text-sm text-muted">A few favourites from the fleet.</p>
          </div>
          <Button to={ROUTES.cars} variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
            View all
          </Button>
        </div>

        <div className="mt-7">
          {isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <VehicleCardSkeleton key={i} />)
                : featured.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
            </div>
          )}
          {!isLoading && !isError && featured.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              Our fleet is being updated — please check back soon.
            </p>
          )}
        </div>
      </section>

      {/* ---------- Areas we serve (local SEO content) ---------- */}
      <section className="container-page py-14">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">
            Self-drive car rental in Kharar, Mohali, Chandigarh &amp; Hamirpur
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Based in Kharar, {businessName} offers self-drive cars for hire across the
            Tricity — Kharar, Mohali and Chandigarh — as well as Hamirpur in Himachal
            Pradesh. Whether it's an airport run, a weekend in the hills or a daily
            commute, pick up a clean, well-maintained car near you and drive on your own
            terms with clear, all-inclusive pricing.
          </p>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_AREAS.map(({ city, region }) => (
            <li
              key={city}
              className="flex items-start gap-3 rounded-xl border border-hair bg-card p-4 shadow-card"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal/12 text-signal-700 dark:text-signal-400">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-fg-strong">Car rental in {city}</p>
                <p className="mt-0.5 text-xs text-muted">{region}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- How it works (lazy) ---------- */}
      <LazySection minHeight={360}>
        <section className="container-page py-16">
          <div className="rounded-2xl border border-hair bg-surface p-8 sm:p-10">
            <h2 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">
              How it works
            </h2>
            <p className="mt-1.5 text-sm text-muted">Four steps from search to the open road.</p>

            <ol className="relative mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {/* route line behind the steps (desktop) */}
              <span className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-route/0 via-route/40 to-route/0 lg:block" />
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative flex flex-col items-start">
                  <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border border-hair bg-card text-ink-800 dark:text-white">
                    <Icon className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-signal text-[11px] font-bold text-ink-900">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-fg-strong">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </LazySection>

      {/* ---------- CTA band (lazy) ---------- */}
      <LazySection minHeight={280}>
        <section className="container-page pb-20">
          <div className="relative overflow-hidden rounded-2xl bg-ink-800 px-8 py-12 text-center sm:px-12 sm:py-16">
            <div className="relative">
              <BadgeCheck className="mx-auto h-9 w-9 text-signal" />
              <h2 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
                Ready to hit the road?
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-white/70 sm:text-base">
                Browse the fleet and lock in your dates with {businessName}. Confirmation is instant.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button to={ROUTES.cars} variant="primary" size="lg">
                  Browse cars
                </Button>
                <Button to={ROUTES.register} variant="secondary" size="lg">
                  Create an account
                </Button>
              </div>
            </div>
          </div>
        </section>
      </LazySection>
    </div>
  );
}

/** Subtle route-line motif for the hero — curved dashed paths + stops. */
function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900" />
      <svg
        className="absolute right-0 top-0 h-full w-2/3 opacity-[0.15]"
        viewBox="0 0 600 400"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-20 360 C 160 360, 180 120, 360 120 S 560 40, 640 40"
          stroke="#0FB5A6"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        <path
          d="M-20 300 C 200 300, 240 200, 420 200 S 620 160, 700 120"
          stroke="#F2A007"
          strokeWidth="2"
          strokeDasharray="2 12"
          strokeLinecap="round"
        />
        <circle cx="360" cy="120" r="5" fill="#0FB5A6" />
        <circle cx="420" cy="200" r="5" fill="#F2A007" />
      </svg>
    </div>
  );
}
