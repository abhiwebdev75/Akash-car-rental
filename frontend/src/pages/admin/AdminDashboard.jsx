import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarRange,
  Car,
  IndianRupee,
  Layers,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useRevenueReport,
  useBookingsReport,
  useUtilizationReport,
  useOutstandingReport,
} from '../../features/reports/hooks';
import { useAdminBookings } from '../../features/bookings/hooks';
import { useMaintenance } from '../../features/maintenance/hooks';
import { useSettings } from '../../features/settings/hooks';
import { vehicleTitle } from '../../features/vehicles/display';
import {
  ROUTES,
  BOOKING_STATUS_META,
  MAINTENANCE_TYPE_LABELS,
} from '../../lib/constants';
import { formatMoney, formatDate, formatDateRange } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { StatCard } from '../../components/admin/StatCard';
import { DataTable } from '../../components/admin/DataTable';
import { Button, Card, CardBody, CardHeader, StatusBadge } from '../../components/ui';

const pct = (v) => `${Math.round((v || 0) * 100)}%`;

// Last-30-days window for the KPI reports (mirrors the backend default, but we
// pass it explicitly so the query key is stable).
function last30() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const range = useMemo(last30, []);

  const revenueQ = useRevenueReport(range);
  const bookingsQ = useBookingsReport(range);
  const utilQ = useUtilizationReport(range);
  const outstandingQ = useOutstandingReport();
  const recentQ = useAdminBookings({ limit: 6, sort: '-createdAt' });
  const maintenanceQ = useMaintenance({ status: 'SCHEDULED' });

  const recent = recentQ.data?.items || [];
  const upcoming = (maintenanceQ.data || []).slice(0, 5);
  const pending = bookingsQ.data?.byStatus?.PENDING?.count || 0;

  const columns = useMemo(
    () => [
      {
        key: 'bookingNumber',
        header: 'Booking',
        render: (b) => (
          <div className="min-w-0">
            <p className="font-semibold text-fg-strong">{b.bookingNumber || '—'}</p>
            <p className="text-xs text-muted">{formatDate(b.createdAt)}</p>
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (b) => <span className="truncate text-fg-strong">{b.customerId?.name || '—'}</span>,
      },
      {
        key: 'vehicle',
        header: 'Vehicle',
        hideOnMobile: true,
        render: (b) => <span className="truncate text-fg">{vehicleTitle(b.vehicleId) || '—'}</span>,
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
    ],
    [currency]
  );

  return (
    <>
      <AdminPageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Your last 30 days at a glance."
        actions={
          <Button
            to={ROUTES.adminBookings}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Manage bookings
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (30d)"
          value={formatMoney(revenueQ.data?.totalRevenue ?? 0, currency)}
          icon={IndianRupee}
          tone="success"
          loading={revenueQ.isLoading}
          to={ROUTES.adminReports}
        />
        <StatCard
          label="Bookings (30d)"
          value={bookingsQ.data?.total ?? 0}
          icon={Layers}
          tone="info"
          loading={bookingsQ.isLoading}
          hint={pending ? `${pending} pending` : undefined}
          to={ROUTES.adminBookings}
        />
        <StatCard
          label="Avg. utilization"
          value={pct(utilQ.data?.averageUtilization)}
          icon={Car}
          tone="warning"
          loading={utilQ.isLoading}
          to={ROUTES.adminReports}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstandingQ.data?.totalOutstanding ?? 0, currency)}
          icon={Wallet}
          tone="danger"
          loading={outstandingQ.isLoading}
          hint={`${outstandingQ.data?.count ?? 0} unpaid`}
          to={ROUTES.adminReports}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent bookings */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-muted" />
              <h2 className="font-display text-base font-semibold text-fg-strong">Recent bookings</h2>
            </div>
            <Button variant="ghost" size="sm" to={ROUTES.adminBookings} rightIcon={<ArrowRight className="h-4 w-4" />}>
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
                description: 'New bookings will show up here.',
              }}
              className="rounded-none border-0"
            />
          </CardBody>
        </Card>

        {/* Upcoming maintenance */}
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-muted" />
              <h2 className="font-display text-base font-semibold text-fg-strong">Scheduled service</h2>
            </div>
            <Button variant="ghost" size="sm" to={ROUTES.adminMaintenance} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Open
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            {maintenanceQ.isLoading ? (
              <div className="h-40 animate-pulse rounded-lg bg-surface" />
            ) : upcoming.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Nothing scheduled.</p>
            ) : (
              upcoming.map((m) => (
                <div
                  key={m._id}
                  className="rounded-xl border border-hair bg-surface/50 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {MAINTENANCE_TYPE_LABELS[m.type] || m.type}
                    </span>
                    {m.scheduledStart && (
                      <span className="text-xs text-muted">{formatDate(m.scheduledStart)}</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-medium text-fg-strong">
                    {vehicleTitle(m.vehicleId) || 'Vehicle'}
                  </p>
                  {m.vehicleId?.registrationNumber && (
                    <p className="truncate font-mono text-xs text-muted">
                      {m.vehicleId.registrationNumber}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
