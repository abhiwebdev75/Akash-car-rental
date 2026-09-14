import { Link } from 'react-router-dom';
import { CalendarRange, Car, ChevronRight, MapPin } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { vehicleImage, vehicleTitle } from '../vehicles/display';
import { ROUTES } from '../../lib/constants';
import { formatMoney, formatDateRange } from '../../lib/formatters';
import { cn } from '../../lib/cn';

/**
 * Compact booking row used in the account dashboard. The whole card links to the
 * booking detail. All figures come straight off the booking the backend returned.
 */
export function BookingCard({ booking, currency = 'INR', className }) {
  const vehicle = booking.vehicleId || {};
  const location = booking.locationId || {};
  const img = vehicleImage(vehicle);

  return (
    <Link
      to={ROUTES.accountBooking(booking._id)}
      className={cn(
        'group flex items-center gap-4 rounded-xl border border-hair bg-card p-3 transition-all hover:border-ink-300 hover:shadow-card dark:hover:border-ink-500 sm:p-4',
        className
      )}
    >
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-paper sm:h-18 sm:w-28">
        {img ? (
          <img src={img} alt={vehicleTitle(vehicle)} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Car className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-semibold text-fg-strong">{vehicleTitle(vehicle)}</p>
          <StatusBadge status={booking.status} kind="booking" size="sm" />
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <CalendarRange className="h-3.5 w-3.5 shrink-0" />
          {formatDateRange(booking.pickupDate, booking.returnDate)}
        </p>
        {location.name && (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {location.city ? `${location.name}, ${location.city}` : location.name}
          </p>
        )}
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-bold text-fg-strong">{formatMoney(booking.totalAmount, currency)}</p>
        <p className="mt-0.5 text-xs text-muted">#{booking.bookingNumber}</p>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-fg-strong" />
    </Link>
  );
}
