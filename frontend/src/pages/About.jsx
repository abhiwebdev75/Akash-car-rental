import {
  ArrowRight,
  CalendarCheck,
  Car,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { Button } from '../components/ui/Button';
import { useSettings } from '../features/settings/hooks';
import { useLocations } from '../features/locations/hooks';
import { useVehicles } from '../features/vehicles/hooks';
import { ROUTES } from '../lib/constants';

const VALUES = [
  {
    icon: Wallet,
    title: 'Transparent pricing',
    text: 'Every quote is itemised — base rental, add-ons, taxes and the refundable deposit are all shown before you pay a rupee.',
  },
  {
    icon: ShieldCheck,
    title: 'A fleet you can trust',
    text: 'Cars are serviced and inspected between rentals, with condition logged at pickup and return so there are no surprises.',
  },
  {
    icon: CalendarCheck,
    title: 'Real-time availability',
    text: 'What you see is genuinely bookable. Live availability means instant confirmation — no phone tag, no waiting.',
  },
  {
    icon: MapPin,
    title: 'Pickup near you',
    text: 'Collect and drop off at whichever of our branches suits your trip, at a time that works for you.',
  },
];

const PROMISES = [
  { icon: ReceiptText, text: 'No hidden fees — the price at checkout is the price you pay.' },
  { icon: Sparkles, text: 'Clean, well-maintained vehicles, ready to drive.' },
  { icon: ShieldCheck, text: 'A fully refundable security deposit, returned after a clean handback.' },
  { icon: CalendarCheck, text: 'Free cancellation within the window shown on your booking.' },
];

export default function About() {
  const { data: settings } = useSettings();
  const { data: locations } = useLocations();
  const { data: vehicleData } = useVehicles({ limit: 1 });

  const businessName = settings?.businessName || 'Akash Car Rental';
  const locationCount = locations?.length || 0;
  const fleetCount = vehicleData?.meta?.total || 0;
  const cities = Array.from(new Set((locations || []).map((l) => l.city).filter(Boolean)));

  const stats = [
    fleetCount > 0 && { value: `${fleetCount}+`, label: 'Cars in the fleet' },
    locationCount > 0 && {
      value: String(locationCount),
      label: locationCount === 1 ? 'Pickup location' : 'Pickup locations',
    },
    cities.length > 0 && {
      value: String(cities.length),
      label: cities.length === 1 ? 'City served' : 'Cities served',
    },
  ].filter(Boolean);

  return (
    <div>
      <PageHero
        eyebrow="About us"
        title={`Self-drive rentals, done honestly.`}
        subtitle={`${businessName} exists to make renting a car feel effortless — clear prices, a dependable fleet, and confirmation in minutes.`}
      />

      {/* Stats */}
      {stats.length > 0 && (
        <section className="container-page -mt-8 relative">
          <div className="grid gap-4 rounded-2xl border border-hair bg-card p-6 shadow-card sm:grid-cols-3 sm:p-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-extrabold text-fg-strong sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Story */}
      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">
              Renting a car shouldn’t be the hard part of your trip
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
              <p>
                We started {businessName} with a simple frustration in mind: booking a car too
                often means unclear pricing, uncertain availability, and a stack of paperwork at
                the counter. We thought it could be calmer than that.
              </p>
              <p>
                So we built the whole experience around being upfront. You search real, live
                availability for your dates, see an itemised quote with taxes and deposit spelled
                out, and confirm in a couple of taps. When you arrive, the car is clean, checked,
                and ready — and the handback is just as straightforward.
              </p>
              <p>
                Whether it’s a weekend escape, an airport run, or a month-long need, our aim is the
                same: a well-kept car, a fair price, and none of the usual friction.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-hair bg-surface p-6 sm:p-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-fg-strong">
              Our promise
            </h3>
            <ul className="mt-5 space-y-4">
              {PROMISES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-route/12 text-route">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-relaxed text-fg">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-hair bg-surface">
        <div className="container-page py-14 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">
              What we care about
            </h2>
            <p className="mt-2 text-sm text-muted sm:text-base">
              The principles behind every booking.
            </p>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-route/12 text-route">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-fg-strong">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations preview */}
      {locationCount > 0 && (
        <section className="container-page py-14 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">
                Where to find us
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                {locationCount === 1
                  ? 'Our pickup point.'
                  : `${locationCount} pickup points and counting.`}
              </p>
            </div>
            <Button
              to={ROUTES.contact}
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Contact & directions
            </Button>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => (
              <div key={loc._id} className="rounded-xl border border-hair bg-card p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-signal/15 text-signal-700 dark:text-signal-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <h3 className="mt-3 font-semibold text-fg-strong">{loc.name}</h3>
                {(loc.address || loc.city) && (
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {[loc.address, loc.city, loc.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-ink-800 px-8 py-12 text-center sm:px-12 sm:py-14">
          <Car className="mx-auto h-9 w-9 text-signal" />
          <h2 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Find your car
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/70 sm:text-base">
            Browse the fleet, check live availability, and book in minutes.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button to={ROUTES.cars} variant="primary" size="lg">
              Browse cars
            </Button>
            <Button to={ROUTES.contact} variant="secondary" size="lg">
              Get in touch
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
