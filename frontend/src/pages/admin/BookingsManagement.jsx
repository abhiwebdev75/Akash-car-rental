import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarRange, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminBookings } from '../../features/bookings/hooks';
import { useAdminLocations } from '../../features/locations/hooks';
import { useSettings } from '../../features/settings/hooks';
import { vehicleTitle } from '../../features/vehicles/display';
import { extractApiError } from '../../lib/apiClient';
import {
  ROUTES,
  BOOKING_STATUS_OPTIONS,
  MANAGER_UP,
} from '../../lib/constants';
import { formatMoney, formatDateRange, formatDate } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import { Button, Pagination, Select, StatusBadge } from '../../components/ui';

const PAGE_SIZE = 15;

export default function BookingsManagement() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canCreate = hasRole(...MANAGER_UP);
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  // Status lives in the URL so Dashboard deep-links (?status=PENDING) work and
  // the filtered view is shareable/bookmarkable.
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const locationId = searchParams.get('locationId') || '';
  const page = Number(searchParams.get('page')) || 1;

  const patchParams = (patch) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      // Any filter change resets to page 1.
      if (!('page' in patch)) next.delete('page');
      return next;
    });
  };

  const { data: locations = [] } = useAdminLocations();
  const { data, isLoading, isError, error } = useAdminBookings({
    status,
    locationId,
    page,
    limit: PAGE_SIZE,
    sort: '-createdAt',
  });

  const bookings = data?.items || [];
  const meta = data?.meta;

  const locationOptions = useMemo(
    () => [{ value: '', label: 'All locations' }, ...locations.map((l) => ({ value: l._id, label: l.name }))],
    [locations]
  );

  const columns = [
    {
      key: 'bookingNumber',
      header: 'Booking',
      render: (b) => (
        <div className="min-w-0">
          <p className="font-semibold text-fg-strong">{b.bookingNumber || '—'}</p>
          <p className="text-xs text-muted">Booked {formatDate(b.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (b) => (
        <div className="min-w-0">
          <p className="truncate text-fg-strong">{b.customerId?.name || '—'}</p>
          {b.customerId?.phone && <p className="truncate text-xs text-muted">{b.customerId.phone}</p>}
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      hideOnMobile: true,
      render: (b) => (
        <div className="min-w-0">
          <p className="truncate text-fg-strong">{vehicleTitle(b.vehicleId) || '—'}</p>
          {b.vehicleId?.registrationNumber && (
            <p className="truncate font-mono text-xs text-muted">{b.vehicleId.registrationNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      hideOnMobile: true,
      render: (b) => (
        <span className="whitespace-nowrap text-muted">{formatDateRange(b.pickupDate, b.returnDate)}</span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      hideOnMobile: true,
      render: (b) => <StatusBadge status={b.paymentStatus} kind="payment" size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <StatusBadge status={b.status} size="sm" />,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (b) => (
        <span className="font-medium tabular-nums">{formatMoney(b.totalAmount, currency)}</span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Bookings"
        description={meta ? `${meta.total} booking${meta.total === 1 ? '' : 's'}` : 'Manage reservations'}
        actions={
          canCreate ? (
            <Button to={ROUTES.adminBookingNew} leftIcon={<Plus className="h-4 w-4" />}>
              New booking
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
        <Select
          value={status}
          onChange={(e) => patchParams({ status: e.target.value })}
          options={[{ value: '', label: 'All statuses' }, ...BOOKING_STATUS_OPTIONS]}
          aria-label="Filter by status"
        />
        <Select
          value={locationId}
          onChange={(e) => patchParams({ locationId: e.target.value })}
          options={locationOptions}
          aria-label="Filter by location"
        />
      </div>

      <DataTable
        columns={columns}
        rows={bookings}
        loading={isLoading}
        onRowClick={(b) => navigate(ROUTES.adminBooking(b._id))}
        empty={{
          icon: CalendarRange,
          title: isError ? 'Could not load bookings' : 'No bookings found',
          description: isError
            ? extractApiError(error).message
            : status || locationId
              ? 'Try clearing the filters to see more.'
              : 'New reservations will appear here as they come in.',
        }}
      />

      {meta && meta.totalPages > 1 && (
        <div className="mt-5">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => patchParams({ page: String(p) })}
          />
        </div>
      )}
    </>
  );
}
