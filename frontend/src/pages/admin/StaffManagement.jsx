import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, ShieldCheck, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUsers, useCreateStaff, useUpdateUser } from '../../features/users/hooks';
import { useAdminLocations } from '../../features/locations/hooks';
import { extractApiError } from '../../lib/apiClient';
import {
  OWNER_ONLY,
  ROLES,
  ROLE_LABELS,
  STAFF_ROLE_OPTIONS,
  USER_STATUS_META,
  USER_STATUS_OPTIONS,
} from '../../lib/constants';
import { initials } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
} from '../../components/ui';

const STAFF_ROLE_LIST = [ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.ACCOUNTANT];
const ROLE_TONE = {
  OWNER: 'warning',
  MANAGER: 'info',
  STAFF: 'neutral',
  ACCOUNTANT: 'success',
};

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: ROLES.STAFF,
  assignedLocation: '',
  status: 'ACTIVE',
};

export default function StaffManagement() {
  const { user: currentUser, hasRole } = useAuth();
  const canManage = hasRole(...OWNER_ONLY);

  // The user directory filters by a single role, so fetch each staff role in
  // parallel and merge. limit is generous — a rental business has few staff.
  const ownerQ = useUsers({ role: ROLES.OWNER, limit: 100 });
  const managerQ = useUsers({ role: ROLES.MANAGER, limit: 100 });
  const staffQ = useUsers({ role: ROLES.STAFF, limit: 100 });
  const accountantQ = useUsers({ role: ROLES.ACCOUNTANT, limit: 100 });
  const roleQueries = [ownerQ, managerQ, staffQ, accountantQ];

  const { data: locations = [] } = useAdminLocations();
  const locationName = useMemo(() => {
    const map = {};
    locations.forEach((l) => {
      map[l._id] = l.name;
    });
    return map;
  }, [locations]);

  const isLoading = roleQueries.some((q) => q.isLoading);
  const isError = roleQueries.some((q) => q.isError);

  const team = useMemo(() => {
    const all = roleQueries.flatMap((q) => q.data?.items || []);
    const order = Object.fromEntries(STAFF_ROLE_LIST.map((r, i) => [r, i]));
    return all.sort(
      (a, b) => (order[a.role] - order[b.role]) || a.name.localeCompare(b.name)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerQ.data, managerQ.data, staffQ.data, accountantQ.data]);

  const [editing, setEditing] = useState(undefined); // undefined = closed, null = create, obj = edit

  const resolveLocation = (u) => {
    const raw = u.assignedLocation;
    if (!raw) return null;
    if (typeof raw === 'object') return raw.name || locationName[raw._id] || '—';
    return locationName[raw] || '—';
  };

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'member',
        header: 'Member',
        render: (u) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-fg-strong ring-1 ring-hair">
              {initials(u.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg-strong">{u.name}</p>
              <p className="truncate text-xs text-muted">{u.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (u) => (
          <Badge tone={ROLE_TONE[u.role] || 'neutral'} size="sm">
            {ROLE_LABELS[u.role] || u.role}
          </Badge>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        hideOnMobile: true,
        render: (u) => u.phone || <span className="text-muted">—</span>,
      },
      {
        key: 'location',
        header: 'Location',
        hideOnMobile: true,
        render: (u) => resolveLocation(u) || <span className="text-muted">Any</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (u) => {
          const meta = USER_STATUS_META[u.status] || { label: u.status, tone: 'neutral' };
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
        render: (u) => (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation();
              setEditing(u);
            }}
          >
            Edit
          </Button>
        ),
      });
    }
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, locationName]);

  return (
    <>
      <AdminPageHeader
        title="Team"
        description="Staff accounts and their access across the business."
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>
              Add staff
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={team}
        loading={isLoading}
        onRowClick={canManage ? (u) => setEditing(u) : undefined}
        empty={{
          icon: UserCog,
          title: isError ? 'Could not load the team' : 'No staff yet',
          description: isError
            ? 'Something went wrong. Try again in a moment.'
            : 'Add your first staff account to get started.',
        }}
      />

      {canManage && (
        <StaffForm
          key={editing === undefined ? 'closed' : editing?._id || 'new'}
          open={editing !== undefined}
          staff={editing || null}
          locations={locations}
          currentUserId={currentUser?._id}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}

function StaffForm({ open, staff, locations, currentUserId, onClose }) {
  const toast = useToast();
  const isEdit = !!staff;
  const isSelf = isEdit && staff._id === currentUserId;

  const createStaff = useCreateStaff();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    if (staff) {
      const loc = staff.assignedLocation;
      reset({
        ...EMPTY,
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        role: staff.role || ROLES.STAFF,
        status: staff.status || 'ACTIVE',
        assignedLocation: (typeof loc === 'object' ? loc?._id : loc) || '',
      });
    } else {
      reset(EMPTY);
    }
  }, [open, staff, reset]);

  const locationOptions = useMemo(
    () => [
      { value: '', label: 'Any location' },
      ...locations.map((l) => ({ value: l._id, label: `${l.name}${l.city ? ` · ${l.city}` : ''}` })),
    ],
    [locations]
  );

  const applyFieldErrors = (err) => {
    const { message, errors: fieldErrors } = extractApiError(err);
    if (Array.isArray(fieldErrors)) {
      fieldErrors.forEach((fe) => {
        if (fe.field && fe.field in EMPTY) setError(fe.field, { message: fe.message });
      });
    }
    toast.error(message);
  };

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        const payload = {
          name: values.name.trim(),
          phone: values.phone.trim(),
          assignedLocation: values.assignedLocation || null,
        };
        // Guard against self-lockout: an owner can't change their own role/status.
        if (!isSelf) {
          payload.role = values.role;
          payload.status = values.status;
        }
        await updateUser.mutateAsync({ id: staff._id, payload });
        toast.success('Staff member updated');
      } else {
        const payload = {
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          role: values.role,
        };
        if (values.phone.trim()) payload.phone = values.phone.trim();
        if (values.assignedLocation) payload.assignedLocation = values.assignedLocation;
        await createStaff.mutateAsync(payload);
        toast.success('Staff member added');
      }
      onClose();
    } catch (err) {
      applyFieldErrors(err);
    }
  };

  const saving = isSubmitting || createStaff.isPending || updateUser.isPending;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? 'Edit staff member' : 'Add staff member'}
      description={isEdit ? staff.email : 'Create an account for a team member.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="staff-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Create account'}
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full name"
          required
          placeholder="Priya Sharma"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />
        <Input
          label="Email"
          type="email"
          required
          placeholder="priya@akashcarrental.com"
          hint={isEdit ? 'Email cannot be changed after the account is created.' : undefined}
          disabled={isEdit}
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        {!isEdit && (
          <Input
            label="Temporary password"
            type="password"
            required
            hint="At least 8 characters. The staff member can change it later."
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' },
            })}
          />
        )}
        <Input
          label="Phone"
          placeholder="98765 43210"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Role"
            required
            options={STAFF_ROLE_OPTIONS}
            disabled={isSelf}
            hint={isSelf ? 'You cannot change your own role.' : undefined}
            error={errors.role?.message}
            {...register('role', { required: 'Role is required' })}
          />
          <Select
            label="Assigned location"
            hint="Managers & staff are scoped to their location."
            options={locationOptions}
            error={errors.assignedLocation?.message}
            {...register('assignedLocation')}
          />
        </div>
        {isEdit && (
          <Select
            label="Account status"
            options={USER_STATUS_OPTIONS}
            disabled={isSelf}
            hint={isSelf ? 'You cannot deactivate your own account.' : undefined}
            error={errors.status?.message}
            {...register('status')}
          />
        )}
        {isEdit && !isSelf && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" />
            Changes take effect immediately across the business.
          </p>
        )}
      </form>
    </Modal>
  );
}
