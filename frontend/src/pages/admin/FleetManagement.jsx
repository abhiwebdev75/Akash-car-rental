import { useMemo, useState } from 'react';
import { Car, Pencil, Plus, Power } from 'lucide-react';
import { useAdminVehicles, useDeleteVehicle } from '../../features/vehicles/hooks';
import { useLocations } from '../../features/locations/hooks';
import { useSettings } from '../../features/settings/hooks';
import { useToast } from '../../context/ToastContext';
import { vehicleTitle, vehicleImage } from '../../features/vehicles/display';
import { extractApiError } from '../../lib/apiClient';
import {
  ROUTES,
  VEHICLE_STATUS,
  VEHICLE_STATUS_META,
  VEHICLE_STATUS_FILTER_OPTIONS,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPE_OPTIONS,
} from '../../lib/constants';
import { formatMoney } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { Badge, Button, Pagination, Select } from '../../components/ui';

const PAGE_SIZE = 12;

export default function FleetManagement() {
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';
  const toast = useToast();

  const [filters, setFilters] = useState({ status: '', vehicleType: '', locationId: '' });
  const [page, setPage] = useState(1);
  const [toDeactivate, setToDeactivate] = useState(null);

  const { data: locations = [] } = useLocations();
  const { data, isLoading, isError, error } = useAdminVehicles({
    ...filters,
    page,
    limit: PAGE_SIZE,
    sort: '-createdAt',
  });
  const deleteVehicle = useDeleteVehicle();

  const vehicles = data?.items || [];
  const meta = data?.meta;

  const setFilter = (key) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  };

  const locationOptions = useMemo(
    () => [{ value: '', label: 'All locations' }, ...locations.map((l) => ({ value: l._id, label: l.name }))],
    [locations]
  );

  const handleDeactivate = async () => {
    try {
      await deleteVehicle.mutateAsync(toDeactivate._id);
      toast.success('Vehicle deactivated');
      setToDeactivate(null);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const columns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="h-11 w-16 shrink-0 overflow-hidden rounded-md bg-surface ring-1 ring-hair">
            {vehicleImage(v) ? (
              <img src={vehicleImage(v)} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted">
                <Car className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg-strong">{vehicleTitle(v)}</p>
            <p className="truncate font-mono text-xs text-muted">{v.registrationNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicleType',
      header: 'Type',
      hideOnMobile: true,
      render: (v) => VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType,
    },
    {
      key: 'location',
      header: 'Location',
      hideOnMobile: true,
      render: (v) => v.locationId?.name || '—',
    },
    {
      key: 'dailyPrice',
      header: 'Per day',
      align: 'right',
      render: (v) => (
        <span className="font-medium tabular-nums">{formatMoney(v.dailyPrice, currency)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => {
        const m = VEHICLE_STATUS_META[v.status] || { label: v.status, tone: 'neutral' };
        return (
          <Badge tone={m.tone} dot>
            {m.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            to={ROUTES.adminVehicleEdit(v._id)}
            variant="ghost"
            size="sm"
            leftIcon={<Pencil className="h-4 w-4" />}
          >
            Edit
          </Button>
          {v.status !== VEHICLE_STATUS.INACTIVE && (
            <button
              type="button"
              onClick={() => setToDeactivate(v)}
              title="Deactivate"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <Power className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Fleet"
        description={meta ? `${meta.total} vehicle${meta.total === 1 ? '' : 's'} in your fleet` : 'Manage your vehicles'}
        actions={
          <Button to={ROUTES.adminVehicleNew} leftIcon={<Plus className="h-4 w-4" />}>
            Add vehicle
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select
          value={filters.status}
          onChange={setFilter('status')}
          options={[{ value: '', label: 'All statuses' }, ...VEHICLE_STATUS_FILTER_OPTIONS]}
          aria-label="Filter by status"
        />
        <Select
          value={filters.vehicleType}
          onChange={setFilter('vehicleType')}
          options={[{ value: '', label: 'All types' }, ...VEHICLE_TYPE_OPTIONS]}
          aria-label="Filter by type"
        />
        <Select
          value={filters.locationId}
          onChange={setFilter('locationId')}
          options={locationOptions}
          aria-label="Filter by location"
        />
      </div>

      <DataTable
        columns={columns}
        rows={vehicles}
        loading={isLoading}
        empty={{
          icon: Car,
          title: isError ? 'Could not load fleet' : 'No vehicles found',
          description: isError
            ? extractApiError(error).message
            : 'Try adjusting the filters, or add your first vehicle.',
          action: !isError && (
            <Button to={ROUTES.adminVehicleNew} leftIcon={<Plus className="h-4 w-4" />}>
              Add vehicle
            </Button>
          ),
        }}
      />

      {meta && meta.totalPages > 1 && (
        <div className="mt-5">
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        onConfirm={handleDeactivate}
        loading={deleteVehicle.isPending}
        title="Deactivate vehicle?"
        description={
          toDeactivate
            ? `${vehicleTitle(toDeactivate)} (${toDeactivate.registrationNumber}) will be hidden from the catalog and marked inactive. Existing bookings are unaffected.`
            : ''
        }
        confirmLabel="Deactivate"
      />
    </>
  );
}
