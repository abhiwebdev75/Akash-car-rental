import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { useUsers } from '../../features/users/hooks';
import {
  ROLES,
  ROUTES,
  USER_STATUS_META,
  USER_STATUS_OPTIONS,
} from '../../lib/constants';
import { formatDate, initials, pluralize } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import { Badge, Input, Pagination, Select } from '../../components/ui';

const PAGE_SIZE = 15;

// Small debounce so the directory doesn't refetch on every keystroke.
function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function StatusChip({ status }) {
  const meta = USER_STATUS_META[status] || { label: status, tone: 'neutral' };
  return (
    <Badge tone={meta.tone} size="sm" dot>
      {meta.label}
    </Badge>
  );
}

export default function CustomerManagement() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(query.trim());

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [q, status]);

  const { data, isLoading, isError } = useUsers({
    role: ROLES.CUSTOMER,
    q,
    status,
    page,
    limit: PAGE_SIZE,
    sort: '-createdAt',
  });

  const customers = data?.items || [];
  const meta = data?.meta;

  const columns = useMemo(
    () => [
      {
        key: 'customer',
        header: 'Customer',
        render: (c) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-fg-strong ring-1 ring-hair">
              {initials(c.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg-strong">{c.name || '—'}</p>
              <p className="truncate text-xs text-muted">{c.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        hideOnMobile: true,
        render: (c) => c.phone || <span className="text-muted">—</span>,
      },
      {
        key: 'joined',
        header: 'Joined',
        hideOnMobile: true,
        render: (c) => <span className="whitespace-nowrap text-muted">{formatDate(c.createdAt)}</span>,
      },
      {
        key: 'rentals',
        header: 'Rentals',
        align: 'right',
        hideOnMobile: true,
        render: (c) => <span className="tabular-nums">{c.loyalty?.completedRentals ?? 0}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (c) => <StatusChip status={c.status} />,
      },
    ],
    []
  );

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description={meta ? pluralize(meta.total, 'customer') : 'Everyone who has booked with you'}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_12rem] lg:max-w-2xl">
        <Input
          type="search"
          placeholder="Search by name, email or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          aria-label="Search customers"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[{ value: '', label: 'All statuses' }, ...USER_STATUS_OPTIONS]}
          aria-label="Filter by status"
        />
      </div>

      <DataTable
        columns={columns}
        rows={customers}
        loading={isLoading}
        onRowClick={(c) => navigate(ROUTES.adminCustomer(c._id))}
        empty={{
          icon: Users,
          title: isError ? 'Could not load customers' : 'No customers found',
          description: isError
            ? 'Something went wrong. Try again in a moment.'
            : q || status
              ? 'Try clearing the search or filters.'
              : 'Customers will appear here once people start booking.',
        }}
      />

      {meta && meta.totalPages > 1 && (
        <div className="mt-5">
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}
