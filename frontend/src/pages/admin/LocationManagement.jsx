import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  useAdminLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '../../features/locations/hooks';
import { useUsers } from '../../features/users/hooks';
import { extractApiError } from '../../lib/apiClient';
import {
  MANAGER_UP,
  ROLES,
  USER_STATUS_META,
  USER_STATUS_OPTIONS,
} from '../../lib/constants';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { Badge, Button, Input, Modal, Select } from '../../components/ui';

const EMPTY = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  manager: '',
  status: 'ACTIVE',
};

export default function LocationManagement() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const canManage = hasRole(...MANAGER_UP);

  const { data: locations = [], isLoading, isError } = useAdminLocations();
  const deleteLocation = useDeleteLocation();

  const [editing, setEditing] = useState(undefined); // undefined = closed, null = create, obj = edit
  const [toDelete, setToDelete] = useState(null);

  const resolveManager = (l) => {
    const m = l.manager;
    if (!m) return null;
    return typeof m === 'object' ? m.name : null;
  };

  const handleDelete = async () => {
    try {
      await deleteLocation.mutateAsync(toDelete._id);
      toast.success('Location deleted');
      setToDelete(null);
    } catch (err) {
      const { message, status } = extractApiError(err);
      toast.error(
        status === 409
          ? 'This location still has vehicles assigned. Reassign them first.'
          : message
      );
    }
  };

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'location',
        header: 'Location',
        render: (l) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg-strong">{l.name}</p>
            <p className="truncate font-mono text-xs uppercase text-muted">{l.code}</p>
          </div>
        ),
      },
      {
        key: 'city',
        header: 'City',
        render: (l) => l.city || <span className="text-muted">—</span>,
      },
      {
        key: 'phone',
        header: 'Phone',
        hideOnMobile: true,
        render: (l) => l.phone || <span className="text-muted">—</span>,
      },
      {
        key: 'manager',
        header: 'Manager',
        hideOnMobile: true,
        render: (l) => resolveManager(l) || <span className="text-muted">Unassigned</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (l) => {
          const meta = USER_STATUS_META[l.status] || { label: l.status, tone: 'neutral' };
          return (
            <Badge tone={meta.tone} size="sm" dot>
              {meta.label}
            </Badge>
          );
        },
      },
    ];
    if (canManage) {
      cols.push({
        key: 'actions',
        header: '',
        align: 'right',
        render: (l) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${l.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setEditing(l);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete ${l.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setToDelete(l);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        ),
      });
    }
    return cols;
  }, [canManage]);

  return (
    <>
      <AdminPageHeader
        title="Locations"
        description="Branches that scope your vehicles, bookings and staff."
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>
              Add location
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={locations}
        loading={isLoading}
        onRowClick={canManage ? (l) => setEditing(l) : undefined}
        empty={{
          icon: MapPin,
          title: isError ? 'Could not load locations' : 'No locations yet',
          description: isError
            ? 'Something went wrong. Try again in a moment.'
            : 'Add your first branch to start assigning vehicles.',
        }}
      />

      {canManage && (
        <LocationForm
          key={editing === undefined ? 'closed' : editing?._id || 'new'}
          open={editing !== undefined}
          location={editing || null}
          onClose={() => setEditing(undefined)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteLocation.isPending}
        title="Delete location?"
        description={
          toDelete
            ? `"${toDelete.name}" will be permanently removed. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete"
      />
    </>
  );
}

function LocationForm({ open, location, onClose }) {
  const toast = useToast();
  const isEdit = !!location;

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();

  // Eligible managers: owners + managers.
  const ownerQ = useUsers({ role: ROLES.OWNER, limit: 100 });
  const managerQ = useUsers({ role: ROLES.MANAGER, limit: 100 });
  const managerOptions = useMemo(() => {
    const people = [...(ownerQ.data?.items || []), ...(managerQ.data?.items || [])];
    return [
      { value: '', label: 'Unassigned' },
      ...people.map((p) => ({ value: p._id, label: `${p.name} · ${p.email}` })),
    ];
  }, [ownerQ.data, managerQ.data]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    if (location) {
      const mgr = location.manager;
      reset({
        ...EMPTY,
        name: location.name || '',
        code: location.code || '',
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        pincode: location.pincode || '',
        phone: location.phone || '',
        manager: (typeof mgr === 'object' ? mgr?._id : mgr) || '',
        status: location.status || 'ACTIVE',
      });
    } else {
      reset(EMPTY);
    }
  }, [open, location, reset]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      address: values.address.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      pincode: values.pincode.trim(),
      phone: values.phone.trim(),
      status: values.status,
      manager: values.manager || null,
    };
    try {
      if (isEdit) {
        await updateLocation.mutateAsync({ id: location._id, payload });
        toast.success('Location updated');
      } else {
        await createLocation.mutateAsync(payload);
        toast.success('Location added');
      }
      onClose();
    } catch (err) {
      const { message, errors: fieldErrors } = extractApiError(err);
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe) => {
          if (fe.field && fe.field in EMPTY) setError(fe.field, { message: fe.message });
        });
      }
      toast.error(message);
    }
  };

  const saving = isSubmitting || createLocation.isPending || updateLocation.isPending;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? 'Edit location' : 'Add location'}
      description={isEdit ? location.code : 'Create a new branch.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="location-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add location'}
          </Button>
        </>
      }
    >
      <form id="location-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            required
            placeholder="Kharar Branch"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Code"
            required
            placeholder="KHR"
            hint="Short unique code, e.g. KHR"
            className="uppercase"
            error={errors.code?.message}
            {...register('code', { required: 'Code is required' })}
          />
        </div>
        <Input
          label="Address"
          required
          placeholder="Near Bhagomajra Toll Plaza"
          error={errors.address?.message}
          {...register('address', { required: 'Address is required' })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="City"
            required
            placeholder="Kharar"
            error={errors.city?.message}
            {...register('city', { required: 'City is required' })}
          />
          <Input label="State" placeholder="Punjab" error={errors.state?.message} {...register('state')} />
          <Input label="Pincode" placeholder="140301" error={errors.pincode?.message} {...register('pincode')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            placeholder="98765 43210"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Select
            label="Status"
            options={USER_STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>
        <Select
          label="Manager"
          hint="Optional — the person responsible for this branch."
          options={managerOptions}
          error={errors.manager?.message}
          {...register('manager')}
        />
      </form>
    </Modal>
  );
}
