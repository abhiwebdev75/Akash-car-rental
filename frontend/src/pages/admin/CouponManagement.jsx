import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from '../../features/coupons/hooks';
import { useSettings } from '../../features/settings/hooks';
import { extractApiError } from '../../lib/apiClient';
import { COUPON_TYPE, COUPON_TYPE_OPTIONS, MANAGER_UP } from '../../lib/constants';
import { formatMoney, formatDate, toDateInputValue } from '../../lib/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { DataTable } from '../../components/admin/DataTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { Badge, Button, Input, Modal, Select } from '../../components/ui';

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const EMPTY = {
  code: '',
  type: COUPON_TYPE.PERCENTAGE,
  value: '',
  minimumRental: '',
  maximumDiscount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  active: 'true',
};

function validityLabel(c) {
  const s = c.startDate ? formatDate(c.startDate) : '';
  const e = c.endDate ? formatDate(c.endDate) : '';
  if (s && e) return `${s} – ${e}`;
  if (e) return `Until ${e}`;
  if (s) return `From ${s}`;
  return 'Always';
}

export default function CouponManagement() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const canManage = hasRole(...MANAGER_UP);

  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const { data: coupons = [], isLoading, isError } = useCoupons();
  const deleteCoupon = useDeleteCoupon();

  const [editing, setEditing] = useState(undefined);
  const [toDelete, setToDelete] = useState(null);

  const handleDelete = async () => {
    try {
      await deleteCoupon.mutateAsync(toDelete._id);
      toast.success('Coupon deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'code',
        header: 'Code',
        render: (c) => (
          <span className="font-mono font-semibold uppercase text-fg-strong">{c.code}</span>
        ),
      },
      {
        key: 'discount',
        header: 'Discount',
        render: (c) =>
          c.type === COUPON_TYPE.PERCENTAGE
            ? `${c.value}%${c.maximumDiscount ? ` (max ${formatMoney(c.maximumDiscount, currency)})` : ''}`
            : formatMoney(c.value, currency),
      },
      {
        key: 'minimumRental',
        header: 'Min. rental',
        hideOnMobile: true,
        render: (c) => (c.minimumRental ? formatMoney(c.minimumRental, currency) : <span className="text-muted">—</span>),
      },
      {
        key: 'validity',
        header: 'Validity',
        hideOnMobile: true,
        render: (c) => <span className="whitespace-nowrap text-muted">{validityLabel(c)}</span>,
      },
      {
        key: 'usage',
        header: 'Used',
        align: 'right',
        hideOnMobile: true,
        render: (c) => (
          <span className="tabular-nums">
            {c.usedCount ?? 0}
            <span className="text-muted"> / {c.usageLimit ? c.usageLimit : '∞'}</span>
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (c) => (
          <Badge tone={c.active ? 'success' : 'muted'} size="sm" dot>
            {c.active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ];
    if (canManage) {
      cols.push({
        key: 'actions',
        header: '',
        align: 'right',
        render: (c) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${c.code}`}
              onClick={(e) => {
                e.stopPropagation();
                setEditing(c);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete ${c.code}`}
              onClick={(e) => {
                e.stopPropagation();
                setToDelete(c);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        ),
      });
    }
    return cols;
  }, [canManage, currency]);

  return (
    <>
      <AdminPageHeader
        title="Coupons"
        description="Promo codes applied by the pricing engine at checkout."
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>
              New coupon
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={coupons}
        loading={isLoading}
        onRowClick={canManage ? (c) => setEditing(c) : undefined}
        empty={{
          icon: Tag,
          title: isError ? 'Could not load coupons' : 'No coupons yet',
          description: isError
            ? 'Something went wrong. Try again in a moment.'
            : 'Create a promo code to offer discounts at checkout.',
        }}
      />

      {canManage && (
        <CouponForm
          key={editing === undefined ? 'closed' : editing?._id || 'new'}
          open={editing !== undefined}
          coupon={editing || null}
          currency={currency}
          onClose={() => setEditing(undefined)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteCoupon.isPending}
        title="Delete coupon?"
        description={toDelete ? `"${toDelete.code}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
      />
    </>
  );
}

function CouponForm({ open, coupon, currency, onClose }) {
  const toast = useToast();
  const isEdit = !!coupon;

  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY });

  const type = watch('type');
  const isPercentage = type === COUPON_TYPE.PERCENTAGE;

  useEffect(() => {
    if (!open) return;
    if (coupon) {
      reset({
        code: coupon.code || '',
        type: coupon.type || COUPON_TYPE.PERCENTAGE,
        value: coupon.value ?? '',
        minimumRental: coupon.minimumRental ?? '',
        maximumDiscount: coupon.maximumDiscount ?? '',
        startDate: coupon.startDate ? toDateInputValue(coupon.startDate) : '',
        endDate: coupon.endDate ? toDateInputValue(coupon.endDate) : '',
        usageLimit: coupon.usageLimit ?? '',
        active: coupon.active === false ? 'false' : 'true',
      });
    } else {
      reset(EMPTY);
    }
  }, [open, coupon, reset]);

  const onSubmit = async (values) => {
    const payload = {
      code: values.code.trim().toUpperCase(),
      type: values.type,
      value: Number(values.value),
      active: values.active === 'true',
    };
    if (values.minimumRental !== '') payload.minimumRental = Number(values.minimumRental);
    // Max discount only applies to percentage coupons.
    if (values.type === COUPON_TYPE.PERCENTAGE && values.maximumDiscount !== '') {
      payload.maximumDiscount = Number(values.maximumDiscount);
    }
    if (values.usageLimit !== '') payload.usageLimit = Number(values.usageLimit);
    if (values.startDate) payload.startDate = values.startDate;
    if (values.endDate) payload.endDate = values.endDate;

    try {
      if (isEdit) {
        await updateCoupon.mutateAsync({ id: coupon._id, payload });
        toast.success('Coupon updated');
      } else {
        await createCoupon.mutateAsync(payload);
        toast.success('Coupon created');
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

  const saving = isSubmitting || createCoupon.isPending || updateCoupon.isPending;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? 'Edit coupon' : 'New coupon'}
      description={isEdit ? coupon.code : 'Create a promo code.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Create coupon'}
          </Button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Code"
            required
            placeholder="WELCOME10"
            className="uppercase"
            error={errors.code?.message}
            {...register('code', { required: 'Code is required' })}
          />
          <Select
            label="Type"
            required
            options={COUPON_TYPE_OPTIONS}
            error={errors.type?.message}
            {...register('type', { required: 'Type is required' })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={isPercentage ? 'Discount (%)' : `Discount amount (${currency})`}
            type="number"
            required
            placeholder={isPercentage ? '10' : '500'}
            error={errors.value?.message}
            {...register('value', { required: 'Value is required' })}
          />
          {isPercentage && (
            <Input
              label="Max discount"
              type="number"
              hint="Optional cap on the discount amount."
              placeholder="1000"
              error={errors.maximumDiscount?.message}
              {...register('maximumDiscount')}
            />
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Minimum rental"
            type="number"
            hint="Rental subtotal required to qualify."
            placeholder="0"
            error={errors.minimumRental?.message}
            {...register('minimumRental')}
          />
          <Input
            label="Usage limit"
            type="number"
            hint="Total redemptions. Leave empty for unlimited."
            placeholder="Unlimited"
            error={errors.usageLimit?.message}
            {...register('usageLimit')}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="End date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
          <Select
            label="Status"
            options={ACTIVE_OPTIONS}
            error={errors.active?.message}
            {...register('active')}
          />
        </div>
      </form>
    </Modal>
  );
}
