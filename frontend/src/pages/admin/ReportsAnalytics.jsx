import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  Car,
  Download,
  IndianRupee,
  Layers,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  useRevenueReport,
  useBookingsReport,
  useUtilizationReport,
  useOutstandingReport,
} from '../../features/reports/hooks';
import { reportsApi } from '../../features/reports/api';
import { useSettings } from '../../features/settings/hooks';
import { useLocations } from '../../features/locations/hooks';
import { extractApiError } from '../../lib/apiClient';
import { BOOKING_STATUS_META, PAYMENT_STATUS_META, ROLES } from '../../lib/constants';
import { formatMoney, formatDate } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import { StatCard } from '../../components/admin/StatCard';
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from '../../components/ui';

// ── Date range helpers ───────────────────────────────────────────────────────
function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function presetRange(key) {
  const to = new Date();
  const from = new Date();
  if (key === '7d') from.setDate(to.getDate() - 6);
  else if (key === '30d') from.setDate(to.getDate() - 29);
  else if (key === '90d') from.setDate(to.getDate() - 89);
  else if (key === 'mtd') from.setDate(1);
  else if (key === 'ytd') {
    from.setMonth(0);
    from.setDate(1);
  }
  return { from: isoDate(from), to: isoDate(to) };
}

const PRESETS = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: 'mtd', label: 'Month' },
  { key: 'ytd', label: 'Year' },
];

// Booking-status tone → bar fill. Kept theme-aware (brand tokens + tailwind base).
const BAR_BG = {
  success: 'bg-route-500',
  info: 'bg-blue-500 dark:bg-blue-400',
  warning: 'bg-signal-500',
  danger: 'bg-red-500 dark:bg-red-400',
  neutral: 'bg-ink-400 dark:bg-ink-300',
  muted: 'bg-ink-300 dark:bg-ink-500',
};

const pct = (v) => `${Math.round((v || 0) * 100)}%`;

export default function ReportsAnalytics() {
  const toast = useToast();
  const { hasRole } = useAuth();
  // MANAGER/STAFF are force-scoped to their assigned location by the backend, so
  // a branch filter would be misleading. Only unscoped roles get the dropdown.
  const canPickLocation = hasRole(ROLES.OWNER, ROLES.ACCOUNTANT);

  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const [preset, setPreset] = useState('30d');
  const [range, setRange] = useState(() => presetRange('30d'));
  const [locationId, setLocationId] = useState('');
  const [downloading, setDownloading] = useState(null);

  // The public locations list — accountants have report access but are not
  // allowed to read the staff-only /locations endpoint.
  const { data: locations = [] } = useLocations();
  const locationOptions = useMemo(
    () => [
      { value: '', label: 'All locations' },
      ...locations.map((l) => ({ value: l._id, label: l.name })),
    ],
    [locations]
  );

  const applyPreset = (key) => {
    setPreset(key);
    setRange(presetRange(key));
  };

  const setFrom = (value) => {
    setPreset('');
    setRange((r) => ({ ...r, from: value }));
  };
  const setTo = (value) => {
    setPreset('');
    setRange((r) => ({ ...r, to: value }));
  };

  const params = useMemo(() => {
    const p = {};
    if (range.from) p.from = range.from;
    if (range.to) p.to = range.to;
    if (locationId) p.locationId = locationId;
    return p;
  }, [range, locationId]);

  const revenueQ = useRevenueReport(params);
  const bookingsQ = useBookingsReport(params);
  const utilQ = useUtilizationReport(params);
  const outstandingQ = useOutstandingReport(locationId ? { locationId } : {});

  const revenue = revenueQ.data;
  const bookings = bookingsQ.data;
  const util = utilQ.data;
  const outstanding = outstandingQ.data;

  const handleExport = async (kind) => {
    try {
      setDownloading(kind);
      // Outstanding ignores the date range; everything else honours it.
      const exportParams = kind === 'outstanding' ? (locationId ? { locationId } : {}) : params;
      const blob = await reportsApi.downloadCsv(kind, exportParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${kind}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setDownloading(null);
    }
  };

  const ExportButton = ({ kind }) => (
    <Button
      variant="secondary"
      size="sm"
      leftIcon={<Download className="h-4 w-4" />}
      loading={downloading === kind}
      onClick={() => handleExport(kind)}
    >
      CSV
    </Button>
  );

  // Revenue chart scaling.
  const byDay = revenue?.byDay || [];
  const maxRevenue = Math.max(1, ...byDay.map((d) => d.revenue || 0));

  // Bookings-by-status rows (all statuses, zero-filled, in canonical order).
  const statusRows = useMemo(() => {
    const src = bookings?.byStatus || {};
    return Object.entries(BOOKING_STATUS_META).map(([status, meta]) => ({
      status,
      meta,
      count: src[status]?.count || 0,
      value: src[status]?.value || 0,
    }));
  }, [bookings]);
  const maxStatusCount = Math.max(1, ...statusRows.map((r) => r.count));

  // Top vehicles by utilization.
  const topVehicles = useMemo(
    () => [...(util?.perVehicle || [])].sort((a, b) => b.utilization - a.utilization).slice(0, 8),
    [util]
  );

  const utilColumns = useMemo(
    () => [
      {
        key: 'vehicle',
        header: 'Vehicle',
        render: (v) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-fg-strong">{v.vehicle || '—'}</p>
            <p className="truncate font-mono text-xs text-muted">{v.registrationNumber}</p>
          </div>
        ),
      },
      {
        key: 'bookedDays',
        header: 'Booked days',
        align: 'right',
        hideOnMobile: true,
        render: (v) => <span className="tabular-nums text-fg">{v.bookedDays}</span>,
      },
      {
        key: 'utilization',
        header: 'Utilization',
        render: (v) => (
          <div className="flex items-center justify-end gap-2 sm:justify-start">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-route-500"
                style={{ width: pct(v.utilization) }}
              />
            </div>
            <span className="w-9 text-right tabular-nums text-sm font-medium text-fg-strong">
              {pct(v.utilization)}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  const outstandingColumns = useMemo(
    () => [
      {
        key: 'bookingNumber',
        header: 'Booking',
        render: (r) => <span className="font-semibold text-fg-strong">{r.bookingNumber || '—'}</span>,
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (r) => (
          <div className="min-w-0">
            <p className="truncate text-fg-strong">{r.customer || '—'}</p>
            <p className="truncate text-xs text-muted">{r.phone || ''}</p>
          </div>
        ),
      },
      {
        key: 'paymentStatus',
        header: 'Status',
        hideOnMobile: true,
        render: (r) => {
          const meta = PAYMENT_STATUS_META[r.paymentStatus] || { label: r.paymentStatus, tone: 'neutral' };
          return (
            <Badge tone={meta.tone} size="sm" dot>
              {meta.label}
            </Badge>
          );
        },
      },
      {
        key: 'outstanding',
        header: 'Outstanding',
        align: 'right',
        render: (r) => (
          <span className="font-semibold tabular-nums text-fg-strong">
            {formatMoney(r.outstanding, currency)}
          </span>
        ),
      },
    ],
    [currency]
  );

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Revenue, bookings, fleet utilization and outstanding balances — computed live from the ledger."
      />

      {/* Filter toolbar */}
      <Card className="mb-6">
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <Input
              type="date"
              label="From"
              value={range.from}
              max={range.to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="w-auto"
            />
            <Input
              type="date"
              label="To"
              value={range.to}
              min={range.from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="w-auto"
            />
            {canPickLocation && (
              <Select
                label="Location"
                options={locationOptions}
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-auto"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <Button
                key={p.key}
                variant={preset === p.key ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => applyPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatMoney(revenue?.totalRevenue ?? 0, currency)}
          icon={IndianRupee}
          tone="success"
          loading={revenueQ.isLoading}
          hint="Paid rental & extras"
        />
        <StatCard
          label="Bookings"
          value={bookings?.total ?? 0}
          icon={Layers}
          tone="info"
          loading={bookingsQ.isLoading}
          hint="Created in range"
        />
        <StatCard
          label="Avg. utilization"
          value={pct(util?.averageUtilization)}
          icon={Car}
          tone="warning"
          loading={utilQ.isLoading}
          hint="Fleet, over range"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding?.totalOutstanding ?? 0, currency)}
          icon={Wallet}
          tone="danger"
          loading={outstandingQ.isLoading}
          hint={`${outstanding?.count ?? 0} unpaid bookings`}
        />
      </div>

      {/* Revenue over time */}
      <Card className="mb-6">
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted" />
            <h2 className="font-display text-base font-semibold text-fg-strong">Revenue over time</h2>
          </div>
          <ExportButton kind="revenue" />
        </CardHeader>
        <CardBody>
          {revenueQ.isLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-surface" />
          ) : byDay.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No revenue recorded in this range.</p>
          ) : (
            <>
              <div className="flex h-48 items-end gap-1 overflow-x-auto pb-1">
                {byDay.map((d) => (
                  <div
                    key={d.date}
                    className="group flex h-full min-w-[8px] flex-1 items-end"
                    title={`${formatDate(d.date)}: ${formatMoney(d.revenue, currency)} · ${d.payments} payment${d.payments === 1 ? '' : 's'}`}
                  >
                    <div
                      className="w-full rounded-t bg-route-500/80 transition-colors group-hover:bg-route-500"
                      style={{ height: `${Math.max(2, Math.round((d.revenue / maxRevenue) * 100))}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-hair pt-3 text-xs text-muted">
                <span>{formatDate(byDay[0].date)}</span>
                <span>Peak day {formatMoney(maxRevenue, currency)}</span>
                <span>{formatDate(byDay[byDay.length - 1].date)}</span>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Bookings by status */}
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-fg-strong">Bookings by status</h2>
            <ExportButton kind="bookings" />
          </CardHeader>
          <CardBody className="space-y-3">
            {bookingsQ.isLoading ? (
              <div className="h-40 animate-pulse rounded-lg bg-surface" />
            ) : (
              statusRows.map((r) => (
                <div key={r.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-fg">{r.meta.label}</span>
                    <span className="tabular-nums text-muted">
                      <span className="font-medium text-fg-strong">{r.count}</span>
                      {r.value > 0 && <span> · {formatMoney(r.value, currency)}</span>}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className={`h-full rounded-full ${BAR_BG[r.meta.tone] || BAR_BG.neutral}`}
                      style={{ width: `${Math.round((r.count / maxStatusCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Fleet utilization */}
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-fg-strong">Fleet utilization</h2>
            <ExportButton kind="utilization" />
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              columns={utilColumns}
              rows={topVehicles}
              loading={utilQ.isLoading}
              skeletonRows={5}
              empty={{
                icon: Car,
                title: 'No vehicles',
                description: 'No active vehicles in this range.',
              }}
              className="rounded-none border-0"
            />
          </CardBody>
        </Card>
      </div>

      {/* Outstanding payments */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-muted" />
            <h2 className="font-display text-base font-semibold text-fg-strong">Outstanding payments</h2>
          </div>
          <ExportButton kind="outstanding" />
        </CardHeader>
        <CardBody className="p-0">
          <DataTable
            columns={outstandingColumns}
            rows={outstanding?.rows || []}
            loading={outstandingQ.isLoading}
            skeletonRows={5}
            empty={{
              icon: Wallet,
              title: 'All settled',
              description: 'No bookings have an outstanding balance.',
            }}
            className="rounded-none border-0"
          />
        </CardBody>
      </Card>
    </>
  );
}
