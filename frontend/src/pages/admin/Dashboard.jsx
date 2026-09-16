import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  CarFront,
  Clock,
  IndianRupee,
  Plus,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminBookings } from '../../features/bookings/hooks';
import { useRevenueReport, useOutstandingReport } from '../../features/reports/hooks';
import { useSettings } from '../../features/settings/hooks';
import { BOOKING_STATUS, FINANCE_ROLES, MANAGER_UP, ROUTES } from '../../lib/constants';
import { formatMoney, formatDateRange, toDateInputValue, pluralize } from '../../lib/formatters';
import { vehicleTitle } from '../../features/vehicles/display';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { StatCard } from '../../components/admin/StatCard';
import { DataTable } from '../../components/admin/DataTable';
import { Button, Card, CardHeader, CardBody, StatusBadge } from '../../components/ui';

// Money figures come from the finance reports, which STAFF cannot read. This
// sub-panel is only mounted for finance roles, so its hooks never fire (and
// never 403) for other staff.
function FinanceStats({ currency }) {
  const to = toDateInputValue(new Date());
  const from = toDateInputValue(new Date(Date.now() - 29 * 86_400_000));
  const revenueQ = useRevenueReport({ from, to });
  const outstandingQ = useOutstandingReport();

  return (
    <>
      <StatCard
        label="Revenue · 30 days"
        value={formatMoney(revenueQ.data?.totalRevenue, currency)}
        icon={IndianRupee}
        tone="success"
        loading={revenueQ.isLoading}
        to={ROUTES.adminReports}
      />
      <StatCard
        label="Outstanding"
        value={formatMoney(outstandingQ.data?.totalOutstanding, currency)}
        icon={Wallet}
        tone="warning"
        hint={
          outstandingQ.data ? pluralize(outstandingQ.data.count || 0, 'unpaid booking') : undefined
        }
        loading={outstandingQ.isLoading}
        to={ROUTES.adminReports}
      />
    </>
  );
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';
  const isFinance = hasRole(...FINANCE_ROLES);
  const canCreate = hasRole(...MANAGER_UP);

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Lightweight per-status counts (limit:1 → we only read meta.total).
  const pendingQ = useAdminBookings({ status: BOOKING_STATUS.PENDING, limit: 1 });
  const confirmedQ = useAdminBookings({ status: BOOKING_STATUS.CONFIRMED, limit: 1 });
  const activeQ = useAdminBookings({ status: BOOKING_STATUS.ACTIVE, limit: 1 });
  const recentQ = useAdminBookings({ limit: 8, sort: '-createdAt' });

  const recent = recentQ.data?.items || [];

  const columns = useMemo(
    () => [
      {
        key: 'bookingNumber',
        header: 'Booking',
        render: (b) => (
          <span className="font-semibold text-fg-strong">{b.bookingNumber || '—'}</span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (b) => b.customerId?.name || '—',
      },
      {
        key: 'vehicle',
        header: 'Vehicle',
        hideOnMobile: true,
        render: (b) => vehicleTitle(b.vehicleId) || '—',
      },
      {
        key: 'dates',
        header: 'Dates',
        hideOnMobile: true,
        render: (b) => (
          <span className="whitespace-nowrap text-muted">
            {formatDateRange(b.pickupDate, b.returnDate)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (b) => <StatusBadge status={b.status} />,
      },
      {
        key: 'total',
        header: 'Total',
        align: 'right',
        render: (b) => (
          <span className="font-medium tabular-nums">{formatMoney(b.totalAmount, currency)}</span>
        ),
      },
    ],
    [currency]
  );

  return (
    <>
      <AdminPageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening across the business today."
        actions={
          canCreate ? (
            <Button to={ROUTES.adminBookingNew} leftIcon={<Plus className="h-4 w-4" />}>
              New booking
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isFinance && <FinanceStats currency={currency} />}

        <StatCard
          label="On rental now"
          value={activeQ.data?.meta?.total ?? 0}
          icon={CarFront}
          tone="info"
          loading={activeQ.isLoading}
          to={`${ROUTES.adminBookings}?status=${BOOKING_STATUS.ACTIVE}`}
        />
        <StatCard
          label="Awaiting confirmation"
          value={pendingQ.data?.meta?.total ?? 0}
          icon={Clock}
          tone="warning"
          loading={pendingQ.isLoading}
          to={`${ROUTES.adminBookings}?status=${BOOKING_STATUS.PENDING}`}
        />
        {!isFinance && (
          <StatCard
            label="Upcoming"
            value={confirmedQ.data?.meta?.total ?? 0}
            icon={CalendarRange}
            tone="route"
            loading={confirmedQ.isLoading}
            to={`${ROUTES.adminBookings}?status=${BOOKING_STATUS.CONFIRMED}`}
          />
        )}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-fg-strong">Recent bookings</h2>
          <Button to={ROUTES.adminBookings} variant="ghost" size="sm">
            View all
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable
            columns={columns}
            rows={recent}
            loading={recentQ.isLoading}
            skeletonRows={5}
            onRowClick={(b) => navigate(ROUTES.adminBooking(b._id))}
            empty={{
              icon: CalendarRange,
              title: 'No bookings yet',
              description: 'New reservations will appear here as they come in.',
            }}
            className="rounded-none border-0"
          />
        </CardBody>
      </Card>
    </>
  );
}
