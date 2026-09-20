import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Repeat,
  Star,
} from 'lucide-react';
import { useUser } from '../../features/users/hooks';
import { useAdminBookings } from '../../features/bookings/hooks';
import { useSettings } from '../../features/settings/hooks';
import { vehicleTitle } from '../../features/vehicles/display';
import { extractApiError } from '../../lib/apiClient';
import { ROUTES, USER_STATUS_META } from '../../lib/constants';
import { formatMoney, formatDate, formatDateRange, initials } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import { PageLoader } from '../../components/PageLoader';
import { Badge, Card, CardBody, CardHeader, ErrorState, StatusBadge } from '../../components/ui';

function LoyaltyStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-hair bg-surface/50 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-semibold tabular-nums text-fg-strong">{value}</p>
    </div>
  );
}

function ContactRow({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <span className="text-fg">{children}</span>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const customerQ = useUser(id);
  const bookingsQ = useAdminBookings({ customerId: id, limit: 50, sort: '-createdAt' });

  const customer = customerQ.data;
  const bookings = bookingsQ.data?.items || [];

  const statusMeta = customer ? USER_STATUS_META[customer.status] : null;

  const addressLine = useMemo(() => {
    const a = customer?.address;
    if (!a) return '';
    return [a.line1, a.city, a.state, a.pincode].filter(Boolean).join(', ');
  }, [customer]);

  const columns = useMemo(
    () => [
      {
        key: 'bookingNumber',
        header: 'Booking',
        render: (b) => <span className="font-semibold text-fg-strong">{b.bookingNumber || '—'}</span>,
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

  if (customerQ.isLoading) return <PageLoader label="Loading customer" />;
  if (customerQ.isError) {
    return (
      <ErrorState
        title="Could not load customer"
        error={extractApiError(customerQ.error).message}
        onRetry={customerQ.refetch}
      />
    );
  }

  const loyalty = customer.loyalty || {};

  return (
    <>
      <AdminPageHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        backTo={ROUTES.adminCustomers}
        backLabel="Customers"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* Profile */}
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface text-lg font-semibold text-fg-strong ring-1 ring-hair">
                  {initials(customer.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-fg-strong">{customer.name}</p>
                  {statusMeta && (
                    <Badge tone={statusMeta.tone} size="sm" dot className="mt-1">
                      {statusMeta.label}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 border-t border-hair pt-4">
                <ContactRow icon={Mail}>{customer.email}</ContactRow>
                <ContactRow icon={Phone}>{customer.phone}</ContactRow>
                <ContactRow icon={MapPin}>{addressLine}</ContactRow>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-semibold text-fg-strong">Loyalty</h2>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-3">
              <LoyaltyStat icon={CalendarRange} label="Rentals" value={loyalty.completedRentals ?? 0} />
              <LoyaltyStat icon={Star} label="Points" value={loyalty.points ?? 0} />
              <LoyaltyStat
                icon={IndianRupee}
                label="Total spend"
                value={formatMoney(loyalty.totalSpend ?? 0, currency)}
              />
              <LoyaltyStat icon={Repeat} label="Referrals" value={loyalty.referralCount ?? 0} />
            </CardBody>
          </Card>
        </div>

        {/* Booking history */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-fg-strong">Booking history</h2>
            {bookingsQ.data?.meta && (
              <span className="text-sm text-muted">{bookingsQ.data.meta.total} total</span>
            )}
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              rows={bookings}
              loading={bookingsQ.isLoading}
              skeletonRows={4}
              onRowClick={(b) => navigate(ROUTES.adminBooking(b._id))}
              empty={{
                icon: CalendarRange,
                title: 'No bookings yet',
                description: 'This customer has not made any bookings.',
              }}
              className="rounded-none border-0"
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
