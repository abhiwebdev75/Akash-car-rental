import { Link } from 'react-router-dom';
import { Fuel, Gauge, MapPin, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Rating } from '../../components/ui/Rating';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSettings } from '../settings/hooks';
import { ROUTES, VEHICLE_TYPE_LABELS, TRANSMISSION_LABELS, FUEL_TYPE_LABELS } from '../../lib/constants';
import { formatMoney } from '../../lib/formatters';
import { cn } from '../../lib/cn';

function imageUrl(vehicle) {
  const p = vehicle?.primaryImage;
  if (typeof p === 'string') return p;
  if (p?.url) return p.url;
  const imgs = vehicle?.images || [];
  return (imgs.find((i) => i.isPrimary) || imgs[0])?.url || null;
}

/**
 * Catalog card for a vehicle. The whole card is a single link to the detail
 * page (keeps it accessible — no nested interactive elements). `search`
 * (a querystring) is appended so availability results can carry the chosen
 * dates through to the detail/booking screens.
 */
export function VehicleCard({ vehicle, search = '', className }) {
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const img = imageUrl(vehicle);
  const title = vehicle.title || [vehicle.brand, vehicle.model].filter(Boolean).join(' ');
  const loc = vehicle.locationId;
  const to = { pathname: ROUTES.vehicle(vehicle._id), search: search || undefined };

  return (
    <Card as={Link} to={to} interactive className={cn('group flex flex-col overflow-hidden', className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100 dark:bg-ink-800">
        {img ? (
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Gauge className="h-10 w-10 opacity-30" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge tone="neutral" className="bg-paper/90 backdrop-blur-sm">
            {VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold leading-tight text-fg-strong">
            {title}
          </h3>
          {vehicle.year && <span className="shrink-0 text-xs text-muted">{vehicle.year}</span>}
        </div>

        {typeof vehicle.rating === 'number' && vehicle.rating > 0 && (
          <div className="mt-1.5">
            <Rating value={vehicle.rating} size="sm" showValue />
          </div>
        )}

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <Spec icon={Users}>{vehicle.seats} seats</Spec>
          <Spec icon={Gauge}>{TRANSMISSION_LABELS[vehicle.transmission] || vehicle.transmission}</Spec>
          <Spec icon={Fuel}>{FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType}</Spec>
        </ul>

        {loc?.city && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 text-route" />
            {loc.name ? `${loc.name}, ${loc.city}` : loc.city}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-lg font-bold text-fg-strong">
              {formatMoney(vehicle.dailyPrice, currency)}
              <span className="ml-1 text-xs font-medium text-muted">/ day</span>
            </p>
          </div>
          <span className="text-sm font-semibold text-signal-700 transition-colors group-hover:text-signal-600 dark:text-signal-400">
            View details →
          </span>
        </div>
      </div>
    </Card>
  );
}

function Spec({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </li>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-hair bg-card">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center justify-between pt-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
