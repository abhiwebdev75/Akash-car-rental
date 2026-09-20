import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Ban,
  CheckCircle2,
  PlayCircle,
  Plus,
  Wrench,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  useMaintenance,
  useScheduleMaintenance,
  useStartMaintenance,
  useCompleteMaintenance,
  useCancelMaintenance,
} from '../../features/maintenance/hooks';
import { useAdminVehicles } from '../../features/vehicles/hooks';
import { useSettings } from '../../features/settings/hooks';
import { vehicleTitle } from '../../features/vehicles/display';
import { extractApiError } from '../../lib/apiClient';
import {
  MAINTENANCE_STATUS_META,
  MAINTENANCE_STATUS_OPTIONS,
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_TYPE_OPTIONS,
} from '../../lib/constants';
import { formatMoney, formatDateTime } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { StatCard } from '../../components/admin/StatCard';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  Select,
  Textarea,
} from '../../components/ui';

const STATUS_FILTER_OPTIONS = [{ value: '', label: 'All statuses' }, ...MAINTENANCE_STATUS_OPTIONS];

const EMPTY = {
  vehicleId: '',
  type: 'SERVICE',
  description: '',
  scheduledStart: '',
  scheduledEnd: '',
  vendor: '',
  cost: '',
  notes: '',
};

const COMPLETE_EMPTY = { cost: '', odometerAtService: '', notes: '' };

/** Vehicle label from the populated `vehicleId` sub-document. */
function vehicleLabel(v) {
  if (!v || typeof v !== 'object') return '—';
  return vehicleTitle(v) || '—';
}

export default function MaintenanceHub() {
  const toast = useToast();

  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const [status, setStatus] = useState('');
  const { data: records = [], isLoading, isError } = useMaintenance({ status });

  const [scheduling, setScheduling] = useState(false);
  const [completing, setCompleting] = useState(null); // record being completed
  const [toCancel, setToCancel] = useState(null);

  const startMaintenance = useStartMaintenance();
  const cancelMaintenance = useCancelMaintenance();

  // Counts are for the unfiltered picture, so derive them from the current list
  // only when no filter is applied; otherwise show the filtered total.
  const counts = useMemo(() => {
    const c = { SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    records.forEach((r) => {
      if (c[r.status] != null) c[r.status] += 1;
    });
    return c;
  }, [records]);

  const totalCost = useMemo(
    () => records.reduce((sum, r) => sum + (r.status === 'COMPLETED' ? r.cost || 0 : 0), 0),
    [records]
  );

  const handleStart = async (record) => {
    try {
      await startMaintenance.mutateAsync(record._id);
      toast.success('Maintenance started — vehicle marked unavailable');
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMaintenance.mutateAsync(toCancel._id);
      toast.success('Maintenance cancelled');
      setToCancel(null);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'vehicle',
        header: 'Vehicle',
        render: (r) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg-strong">{vehicleLabel(r.vehicleId)}</p>
            <p className="truncate font-mono text-xs uppercase text-muted">
              {r.vehicleId?.registrationNumber || ''}
            </p>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (r) => (
          <div className="min-w-0">
            <p className="truncate text-fg">{MAINTENANCE_TYPE_LABELS[r.type] || r.type}</p>
            {r.description && <p className="truncate text-xs text-muted">{r.description}</p>}
          </div>
        ),
      },
      {
        key: 'window',
        header: 'Window',
        hideOnMobile: true,
        render: (r) => (
          <div className="whitespace-nowrap text-xs text-muted">
            <p>{r.scheduledStart ? formatDateTime(r.scheduledStart) : '—'}</p>
            <p>{r.scheduledEnd ? formatDateTime(r.scheduledEnd) : ''}</p>
          </div>
        ),
      },
      {
        key: 'vendor',
        header: 'Vendor',
        hideOnMobile: true,
        render: (r) => r.vendor || <span className="text-muted">—</span>,
      },
      {
        key: 'cost',
        header: 'Cost',
        align: 'right',
        hideOnMobile: true,
        render: (r) =>
          r.cost ? (
            <span className="tabular-nums">{formatMoney(r.cost, currency)}</span>
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => {
          const meta = MAINTENANCE_STATUS_META[r.status] || { label: r.status, tone: 'neutral' };
          return (
            <Badge tone={meta.tone} size="sm" dot>
              {meta.label}
            </Badge>
          );
        },
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (r) => {
          // Mirror the backend guards: COMPLETED is terminal; CANCELLED can't be
          // restarted from the UI even though the API would allow it.
          const isOpen = r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS';
          if (!isOpen) return <span className="text-muted">—</span>;
          return (
            <div className="flex items-center justify-end gap-1">
              {r.status === 'SCHEDULED' && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Start maintenance"
                  title="Start"
                  onClick={() => handleStart(r)}
                >
                  <PlayCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                aria-label="Complete maintenance"
                title="Complete"
                onClick={() => setCompleting(r)}
              >
                <CheckCircle2 className="h-4 w-4 text-route-600 dark:text-route-300" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Cancel maintenance"
                title="Cancel"
                onClick={() => setToCancel(r)}
              >
                <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
              </Button>
            </div>
          );
        },
      },
    ],
    // handleStart is stable enough for this list; re-create on currency change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency]
  );

  return (
    <>
      <AdminPageHeader
        title="Maintenance"
        description="Service windows block the vehicle from being booked for that period."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setScheduling(true)}>
            Schedule service
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scheduled" value={counts.SCHEDULED} icon={Wrench} tone="info" loading={isLoading} />
        <StatCard label="In progress" value={counts.IN_PROGRESS} icon={PlayCircle} tone="warning" loading={isLoading} />
        <StatCard label="Completed" value={counts.COMPLETED} icon={CheckCircle2} tone="success" loading={isLoading} />
        <StatCard
          label="Completed spend"
          value={formatMoney(totalCost, currency)}
          icon={Wrench}
          tone="neutral"
          loading={isLoading}
          hint="In the current view"
        />
      </div>

      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-end gap-3">
          <Select
            label="Status"
            options={STATUS_FILTER_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-auto"
          />
        </CardBody>
      </Card>

      <DataTable
        columns={columns}
        rows={records}
        loading={isLoading}
        empty={{
          icon: Wrench,
          title: isError ? 'Could not load maintenance' : 'Nothing scheduled',
          description: isError
            ? 'Something went wrong. Try again in a moment.'
            : 'Schedule a service to block a vehicle for that window.',
        }}
      />

      <ScheduleForm open={scheduling} currency={currency} onClose={() => setScheduling(false)} />

      <CompleteForm
        key={completing?._id || 'complete-closed'}
        open={!!completing}
        record={completing}
        currency={currency}
        onClose={() => setCompleting(null)}
      />

      <ConfirmDialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={handleCancel}
        loading={cancelMaintenance.isPending}
        title="Cancel maintenance?"
        description={
          toCancel
            ? `The window for ${vehicleLabel(toCancel.vehicleId)} will be released and the vehicle can be booked again.`
            : undefined
        }
        confirmLabel="Cancel maintenance"
        cancelLabel="Keep it"
      />
    </>
  );
}

function ScheduleForm({ open, currency, onClose }) {
  const toast = useToast();
  const schedule = useScheduleMaintenance();

  // Vehicles for the picker. Generous limit — a small fleet.
  const { data: vehicleData } = useAdminVehicles({ limit: 200, sort: 'brand' });
  const vehicleOptions = useMemo(
    () =>
      (vehicleData?.items || []).map((v) => ({
        value: v._id,
        label: `${vehicleTitle(v)}${v.registrationNumber ? ` · ${v.registrationNumber}` : ''}`,
      })),
    [vehicleData]
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onSubmit = async (values) => {
    const payload = {
      vehicleId: values.vehicleId,
      type: values.type,
      scheduledStart: values.scheduledStart,
      scheduledEnd: values.scheduledEnd,
    };
    // Omit empty optionals — the backend coerces '' to a number/date and fails.
    if (values.description.trim()) payload.description = values.description.trim();
    if (values.vendor.trim()) payload.vendor = values.vendor.trim();
    if (values.notes.trim()) payload.notes = values.notes.trim();
    if (values.cost !== '') payload.cost = Number(values.cost);

    try {
      await schedule.mutateAsync(payload);
      toast.success('Maintenance scheduled');
      onClose();
    } catch (err) {
      const { message, errors: fieldErrors } = extractApiError(err);
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe) => {
          if (fe.field && fe.field in EMPTY) setError(fe.field, { message: fe.message });
        });
      }
      // A 409 already carries a specific message naming the conflicting booking.
      toast.error(message);
    }
  };

  const saving = isSubmitting || schedule.isPending;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Schedule maintenance"
      description="The vehicle cannot be booked during this window."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="maintenance-form" loading={saving}>
            Schedule
          </Button>
        </>
      }
    >
      <form id="maintenance-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select
          label="Vehicle"
          required
          placeholder="Select a vehicle"
          options={vehicleOptions}
          error={errors.vehicleId?.message}
          {...register('vehicleId', { required: 'Vehicle is required' })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            required
            options={MAINTENANCE_TYPE_OPTIONS}
            error={errors.type?.message}
            {...register('type', { required: 'Type is required' })}
          />
          <Input
            label={`Estimated cost (${currency})`}
            type="number"
            min="0"
            placeholder="0"
            error={errors.cost?.message}
            {...register('cost')}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Starts"
            type="datetime-local"
            required
            error={errors.scheduledStart?.message}
            {...register('scheduledStart', { required: 'Start is required' })}
          />
          <Input
            label="Ends"
            type="datetime-local"
            required
            error={errors.scheduledEnd?.message}
            {...register('scheduledEnd', { required: 'End is required' })}
          />
        </div>
        <Input
          label="Vendor"
          placeholder="Garage or service centre"
          error={errors.vendor?.message}
          {...register('vendor')}
        />
        <Input
          label="Description"
          placeholder="e.g. 20,000 km service"
          error={errors.description?.message}
          {...register('description')}
        />
        <Textarea
          label="Notes"
          rows={3}
          placeholder="Anything the team should know."
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}

function CompleteForm({ open, record, currency, onClose }) {
  const toast = useToast();
  const complete = useCompleteMaintenance();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: COMPLETE_EMPTY });

  useEffect(() => {
    if (!open) return;
    reset({
      ...COMPLETE_EMPTY,
      cost: record?.cost ?? '',
      notes: record?.notes || '',
    });
  }, [open, record, reset]);

  const onSubmit = async (values) => {
    const payload = {};
    if (values.cost !== '') payload.cost = Number(values.cost);
    if (values.odometerAtService !== '') payload.odometerAtService = Number(values.odometerAtService);
    if (values.notes.trim()) payload.notes = values.notes.trim();

    try {
      await complete.mutateAsync({ id: record._id, payload });
      toast.success('Maintenance completed — vehicle released');
      onClose();
    } catch (err) {
      const { message, errors: fieldErrors } = extractApiError(err);
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe) => {
          if (fe.field && fe.field in COMPLETE_EMPTY) setError(fe.field, { message: fe.message });
        });
      }
      toast.error(message);
    }
  };

  const saving = isSubmitting || complete.isPending;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Complete maintenance"
      description={record ? vehicleLabel(record.vehicleId) : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="complete-maintenance-form" loading={saving}>
            Mark completed
          </Button>
        </>
      }
    >
      <form
        id="complete-maintenance-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={`Final cost (${currency})`}
            type="number"
            min="0"
            placeholder="0"
            error={errors.cost?.message}
            {...register('cost')}
          />
          <Input
            label="Odometer (km)"
            type="number"
            min="0"
            hint="Updates the vehicle's mileage."
            placeholder="e.g. 42500"
            error={errors.odometerAtService?.message}
            {...register('odometerAtService')}
          />
        </div>
        <Textarea
          label="Notes"
          rows={3}
          placeholder="Work carried out, parts replaced…"
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}
