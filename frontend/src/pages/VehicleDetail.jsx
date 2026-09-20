import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Check,
  Fuel,
  Gauge,
  GitCompare,
  MapPin,
  MessageCircle,
  Route,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useVehicle } from '../features/vehicles/hooks';
import { useSettings } from '../features/settings/hooks';
import { useCompare } from '../lib/useCompare';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Rating } from '../components/ui/Rating';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ROUTES,
  VEHICLE_TYPE_LABELS,
  TRANSMISSION_LABELS,
  FUEL_TYPE_LABELS,
} from '../lib/constants';
import { formatMoney, formatDate } from '../lib/formatters';

function reviewerName(r) {
  return r?.customerId?.name || r?.customer?.name || r?.userName || r?.name || 'Verified renter';
}

export default function VehicleDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { data: settings } = useSettings();
  const { data: vehicle, isLoading, isError, error, refetch } = useVehicle(id);
  const { has, toggle, isFull } = useCompare();

  const [activeImg, setActiveImg] = useState(0);
  const currency = settings?.currency || 'INR';

  if (isLoading) return <VehicleDetailSkeleton />;
  if (isError) {
    return (
      <div className="container-page py-10">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }
  if (!vehicle) return null;

  const images = vehicle.images?.length ? vehicle.images : [];
  const title = vehicle.title || [vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(' ');
  const loc = vehicle.locationId;
  const reviews = vehicle.reviews || [];
  const bookSearch = searchParams.toString();

  const inCompare = has(vehicle._id);
  const compareBlocked = isFull && !inCompare;

  const specs = [
    { icon: Users, label: 'Seats', value: `${vehicle.seats}` },
    { icon: Gauge, label: 'Transmission', value: TRANSMISSION_LABELS[vehicle.transmission] || vehicle.transmission },
    { icon: Fuel, label: 'Fuel', value: FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType },
    { icon: Briefcase, label: 'Luggage', value: vehicle.luggageCapacity ? `${vehicle.luggageCapacity} bags` : '—' },
    { icon: Calendar, label: 'Year', value: vehicle.year || '—' },
    { icon: Route, label: 'Daily limit', value: vehicle.kmPerDayAllowance ? `${vehicle.kmPerDayAllowance} km` : 'Unlimited' },
  ];

  const waLink = settings?.whatsapp
    ? `https://wa.me/${String(settings.whatsapp).replace(/[^\d]/g, '')}?text=${encodeURIComponent(
        `Hi, I'm interested in the ${title}.`
      )}`
    : null;

  return (
    <div className="container-page py-8 lg:py-10">
      <Link
        to={{ pathname: ROUTES.cars, search: bookSearch }}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg-strong"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to cars
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div>
          {/* Gallery */}
          <div className="overflow-hidden rounded-2xl border border-hair bg-card">
            <div className="aspect-[16/10] bg-ink-100 dark:bg-ink-800">
              {images[activeImg]?.url ? (
                <img src={images[activeImg].url} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <Gauge className="h-14 w-14 opacity-25" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((img, i) => (
                  <button
                    key={img.publicId || i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      i === activeImg ? 'border-signal' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`${title} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title + rating */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="neutral">{VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}</Badge>
              {typeof vehicle.rating === 'number' && vehicle.rating > 0 && (
                <Rating value={vehicle.rating} size="sm" showValue count={reviews.length} />
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-fg-strong">{title}</h1>
          </div>

          {/* Specs */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {specs.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-hair bg-surface p-4">
                <Icon className="h-5 w-5 text-route" />
                <p className="mt-2 text-xs text-muted">{label}</p>
                <p className="text-sm font-semibold text-fg-strong">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {vehicle.description && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-fg-strong">About this car</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{vehicle.description}</p>
            </section>
          )}

          {/* Features */}
          {vehicle.features?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-fg-strong">Features</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {vehicle.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-fg">
                    <Check className="h-4 w-4 shrink-0 text-route" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-fg-strong">
              Reviews {reviews.length > 0 && <span className="text-muted">({reviews.length})</span>}
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No reviews yet — be the first after your trip.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r._id} className="rounded-xl border border-hair bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-fg-strong">{reviewerName(r)}</p>
                      {r.createdAt && <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>}
                    </div>
                    <div className="mt-1">
                      <Rating value={r.rating} size="sm" />
                    </div>
                    {r.review && <p className="mt-2 text-sm leading-relaxed text-muted">{r.review}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right column — booking card */}
        <aside>
          <Card className="sticky top-24 p-6">
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-fg-strong">{formatMoney(vehicle.dailyPrice, currency)}</span>
              <span className="mb-1 text-sm text-muted">/ day</span>
            </div>

            {(vehicle.weeklyPrice || vehicle.monthlyPrice) && (
              <div className="mt-3 space-y-1 text-sm text-muted">
                {vehicle.weeklyPrice > 0 && (
                  <p className="flex justify-between">
                    <span>Weekly</span>
                    <span className="font-medium text-fg">{formatMoney(vehicle.weeklyPrice, currency)}</span>
                  </p>
                )}
                {vehicle.monthlyPrice > 0 && (
                  <p className="flex justify-between">
                    <span>Monthly</span>
                    <span className="font-medium text-fg">{formatMoney(vehicle.monthlyPrice, currency)}</span>
                  </p>
                )}
              </div>
            )}

            <div className="my-5 h-px bg-hair" />

            <ul className="space-y-2.5 text-sm text-muted">
              {vehicle.securityDeposit > 0 && (
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-route" />
                  Refundable deposit {formatMoney(vehicle.securityDeposit, currency)}
                </li>
              )}
              {vehicle.extraKmPrice > 0 && (
                <li className="flex items-center gap-2">
                  <Route className="h-4 w-4 shrink-0 text-route" />
                  {formatMoney(vehicle.extraKmPrice, currency)} / extra km
                </li>
              )}
              {loc?.city && (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-route" />
                  {loc.name ? `${loc.name}, ${loc.city}` : loc.city}
                </li>
              )}
            </ul>

            <Button
              to={{ pathname: ROUTES.book(vehicle._id), search: bookSearch }}
              size="lg"
              fullWidth
              className="mt-6"
            >
              Book this car
            </Button>

            {waLink && (
              <Button
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                fullWidth
                className="mt-3"
                leftIcon={<MessageCircle className="h-4 w-4" />}
              >
                Ask on WhatsApp
              </Button>
            )}

            <Button
              type="button"
              onClick={() => toggle(vehicle._id)}
              variant="ghost"
              fullWidth
              className="mt-3"
              disabled={compareBlocked}
              leftIcon={
                inCompare ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />
              }
            >
              {inCompare ? 'Added to compare' : 'Add to compare'}
            </Button>
            {inCompare ? (
              <p className="mt-2 text-center text-xs text-muted">
                <Link to={ROUTES.compare} className="font-medium text-route-700 hover:underline dark:text-route-300">
                  Go to compare →
                </Link>
              </p>
            ) : compareBlocked ? (
              <p className="mt-2 text-center text-xs text-muted">
                Compare list is full (max 4). Remove one first.
              </p>
            ) : null}

            <p className="mt-4 text-center text-xs text-muted">
              You won’t be charged yet — you’ll see an itemised quote first.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function VehicleDetailSkeleton() {
  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
          <Skeleton className="mt-6 h-8 w-2/3" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
