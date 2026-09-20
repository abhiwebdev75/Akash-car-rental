import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Clock, Lock, Percent, Save, ScrollText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFullSettings, useUpdateSettings } from '../../features/settings/hooks';
import { extractApiError } from '../../lib/apiClient';
import { OWNER_ONLY } from '../../lib/constants';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { PageLoader } from '../../components/PageLoader';
import { Button, Card, CardBody, CardHeader, Input, Textarea, ErrorState } from '../../components/ui';

// Flat form shape mirrors the settings document; nested groups (policies,
// booking, charges) are flattened here and re-nested on submit.
const FIELDS = {
  businessName: '',
  phone: '',
  email: '',
  whatsapp: '',
  address: '',
  currency: 'INR',
  // taxRate is stored as a fraction (0.18); shown to the user as a percent (18).
  taxRatePercent: '',
  // policies
  terms: '',
  cancellation: '',
  fuel: '',
  mileage: '',
  // booking
  turnoverBufferMinutes: '',
  minRentalHours: '',
  cancellationWindowHours: '',
  // charges
  lateFeePerHour: '',
  fuelChargePerUnit: '',
};

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-fg ring-1 ring-hair">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-fg-strong">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

/** Build defaults from the loaded settings document. */
function toFormValues(s) {
  if (!s) return { ...FIELDS };
  const p = s.policies || {};
  const b = s.booking || {};
  const c = s.charges || {};
  const numeric = (v) => (v == null ? '' : String(v));
  return {
    businessName: s.businessName || '',
    phone: s.phone || '',
    email: s.email || '',
    whatsapp: s.whatsapp || '',
    address: s.address || '',
    currency: s.currency || 'INR',
    taxRatePercent: s.taxRate == null ? '' : String(Math.round(s.taxRate * 10000) / 100),
    terms: p.terms || '',
    cancellation: p.cancellation || '',
    fuel: p.fuel || '',
    mileage: p.mileage || '',
    turnoverBufferMinutes: numeric(b.turnoverBufferMinutes),
    minRentalHours: numeric(b.minRentalHours),
    cancellationWindowHours: numeric(b.cancellationWindowHours),
    lateFeePerHour: numeric(c.lateFeePerHour),
    fuelChargePerUnit: numeric(c.fuelChargePerUnit),
  };
}

export default function BusinessSettings() {
  const toast = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole(...OWNER_ONLY);

  const { data: settings, isLoading, isError, error, refetch } = useFullSettings();
  const updateSettings = useUpdateSettings();

  const defaults = useMemo(() => toFormValues(settings), [settings]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: FIELDS });

  useEffect(() => {
    if (settings) reset(toFormValues(settings));
  }, [settings, reset]);

  const onSubmit = async (values) => {
    // Assemble a full payload, then diff against the loaded document so we PATCH
    // only what changed (backend accepts partial updates and merges groups).
    const payload = {};
    const set = (key, val) => {
      if (val !== defaults[key]) payload[key] = val;
    };

    // Flat string fields.
    ['businessName', 'phone', 'email', 'whatsapp', 'address', 'currency'].forEach((k) =>
      set(k, values[k].trim())
    );

    // taxRate: percent → fraction.
    if (values.taxRatePercent !== defaults.taxRatePercent) {
      if (values.taxRatePercent === '') {
        // Leave unchanged rather than sending an invalid empty number.
      } else {
        payload.taxRate = Number(values.taxRatePercent) / 100;
      }
    }

    // policies group — only include changed keys.
    const policies = {};
    ['terms', 'cancellation', 'fuel', 'mileage'].forEach((k) => {
      if (values[k] !== defaults[k]) policies[k] = values[k].trim();
    });
    if (Object.keys(policies).length) payload.policies = policies;

    // booking group (integers).
    const booking = {};
    ['turnoverBufferMinutes', 'minRentalHours', 'cancellationWindowHours'].forEach((k) => {
      if (values[k] !== defaults[k] && values[k] !== '') booking[k] = Number(values[k]);
    });
    if (Object.keys(booking).length) payload.booking = booking;

    // charges group.
    const charges = {};
    ['lateFeePerHour', 'fuelChargePerUnit'].forEach((k) => {
      if (values[k] !== defaults[k] && values[k] !== '') charges[k] = Number(values[k]);
    });
    if (Object.keys(charges).length) payload.charges = charges;

    if (Object.keys(payload).length === 0) {
      toast.info?.('No changes to save');
      return;
    }

    try {
      await updateSettings.mutateAsync(payload);
      toast.success('Settings saved');
    } catch (err) {
      const { message, errors: fieldErrors } = extractApiError(err);
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe) => {
          // Map nested field paths (e.g. "booking.minRentalHours") back to the flat form.
          const leaf = fe.field?.split('.').pop();
          if (leaf && leaf in FIELDS) setError(leaf, { message: fe.message });
        });
      }
      toast.error(message);
    }
  };

  if (isLoading) return <PageLoader label="Loading settings" />;
  if (isError) {
    return (
      <ErrorState
        title="Could not load settings"
        error={extractApiError(error).message}
        onRetry={refetch}
      />
    );
  }

  const saving = isSubmitting || updateSettings.isPending;

  return (
    <>
      <AdminPageHeader
        title="Business settings"
        description="Branding, contact details, tax and the rules the booking engine enforces."
        actions={
          canEdit ? (
            <Button
              type="submit"
              form="settings-form"
              leftIcon={<Save className="h-4 w-4" />}
              loading={saving}
            >
              Save changes
            </Button>
          ) : null
        }
      />

      {!canEdit && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-hair bg-surface/60 px-4 py-3 text-sm text-muted">
          <Lock className="h-4 w-4 shrink-0" />
          These settings are read-only. Only the owner can make changes.
        </div>
      )}

      <fieldset disabled={!canEdit} className="min-w-0">
        <form id="settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <SectionCard
            icon={Building2}
            title="Business profile"
            description="Shown across the storefront and on customer communications."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Business name"
                required
                error={errors.businessName?.message}
                {...register('businessName', { required: 'Business name is required' })}
              />
              <Input label="Currency" hint="ISO code, e.g. INR" {...register('currency')} error={errors.currency?.message} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Input label="WhatsApp" error={errors.whatsapp?.message} {...register('whatsapp')} />
            </div>
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Textarea label="Address" rows={2} error={errors.address?.message} {...register('address')} />
          </SectionCard>

          <SectionCard
            icon={Percent}
            title="Tax"
            description="Applied by the pricing engine to every quote."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Tax rate (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                hint="e.g. 18 for 18% GST"
                error={errors.taxRatePercent?.message}
                {...register('taxRatePercent')}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Clock}
            title="Booking rules"
            description="Enforced by the backend when customers book — the frontend never overrides these."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Turnover buffer (mins)"
                type="number"
                min="0"
                hint="Gap required between two bookings."
                error={errors.turnoverBufferMinutes?.message}
                {...register('turnoverBufferMinutes')}
              />
              <Input
                label="Min. rental (hours)"
                type="number"
                min="1"
                error={errors.minRentalHours?.message}
                {...register('minRentalHours')}
              />
              <Input
                label="Free-cancel window (hours)"
                type="number"
                min="0"
                hint="Full refund before pickup."
                error={errors.cancellationWindowHours?.message}
                {...register('cancellationWindowHours')}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Late fee / hour"
                type="number"
                min="0"
                error={errors.lateFeePerHour?.message}
                {...register('lateFeePerHour')}
              />
              <Input
                label="Fuel charge / unit"
                type="number"
                min="0"
                hint="Per % / eighth below the pickup level."
                error={errors.fuelChargePerUnit?.message}
                {...register('fuelChargePerUnit')}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={ScrollText}
            title="Policies"
            description="Displayed to customers during booking and on your policy pages."
          >
            <Textarea label="Terms & conditions" rows={3} error={errors.terms?.message} {...register('terms')} />
            <Textarea label="Cancellation policy" rows={3} error={errors.cancellation?.message} {...register('cancellation')} />
            <Textarea label="Fuel policy" rows={2} error={errors.fuel?.message} {...register('fuel')} />
            <Textarea label="Mileage policy" rows={2} error={errors.mileage?.message} {...register('mileage')} />
          </SectionCard>

          {canEdit && (
            <div className="flex justify-end">
              <Button type="submit" leftIcon={<Save className="h-4 w-4" />} loading={saving}>
                Save changes
              </Button>
            </div>
          )}
        </form>
      </fieldset>
    </>
  );
}
