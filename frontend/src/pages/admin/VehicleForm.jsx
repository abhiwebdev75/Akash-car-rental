import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react';
import {
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
  useUploadVehicleImages,
  useDeleteVehicleImage,
} from '../../features/vehicles/hooks';
import { useAdminLocations } from '../../features/locations/hooks';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../lib/apiClient';
import { vehicleTitle } from '../../features/vehicles/display';
import { toDateInputValue } from '../../lib/formatters';
import {
  ROUTES,
  VEHICLE_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  FUEL_TYPE_OPTIONS,
  VEHICLE_STATUS_FORM_OPTIONS,
} from '../../lib/constants';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { PageLoader } from '../../components/PageLoader';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  Textarea,
  ErrorState,
} from '../../components/ui';

const NUMBER_FIELDS = [
  'year',
  'seats',
  'luggageCapacity',
  'dailyPrice',
  'weeklyPrice',
  'monthlyPrice',
  'securityDeposit',
  'extraKmPrice',
  'kmPerDayAllowance',
  'currentMileage',
  'nextServiceMileage',
];
const DATE_FIELDS = ['lastServiceDate', 'insuranceExpiry', 'pucExpiry'];

const EMPTY_DEFAULTS = {
  brand: '',
  model: '',
  variant: '',
  year: '',
  registrationNumber: '',
  vehicleType: '',
  transmission: '',
  fuelType: '',
  seats: '',
  luggageCapacity: '',
  dailyPrice: '',
  weeklyPrice: '',
  monthlyPrice: '',
  securityDeposit: '',
  extraKmPrice: '',
  kmPerDayAllowance: '',
  currentMileage: '',
  nextServiceMileage: '',
  lastServiceDate: '',
  insuranceExpiry: '',
  pucExpiry: '',
  locationId: '',
  status: 'AVAILABLE',
  description: '',
  features: '',
};

// Turn a loaded vehicle into flat form values (dates → yyyy-mm-dd, features → csv).
function toFormValues(v) {
  const out = { ...EMPTY_DEFAULTS };
  Object.keys(EMPTY_DEFAULTS).forEach((k) => {
    if (v[k] !== undefined && v[k] !== null) out[k] = v[k];
  });
  DATE_FIELDS.forEach((k) => {
    out[k] = v[k] ? toDateInputValue(v[k]) : '';
  });
  out.locationId = v.locationId?._id || v.locationId || '';
  out.features = Array.isArray(v.features) ? v.features.join(', ') : '';
  return out;
}

// Flat form values → clean API payload (coerce numbers, drop empty numbers/dates).
function toPayload(values) {
  const payload = {};
  // Strings: required + free-text that supports clearing ('' is valid server-side).
  ['brand', 'model', 'variant', 'registrationNumber', 'vehicleType', 'transmission', 'fuelType', 'locationId', 'status', 'description'].forEach(
    (k) => {
      const raw = values[k];
      payload[k] = typeof raw === 'string' ? raw.trim() : raw ?? '';
    }
  );
  NUMBER_FIELDS.forEach((k) => {
    const raw = values[k];
    if (raw !== '' && raw !== null && raw !== undefined) payload[k] = Number(raw);
  });
  DATE_FIELDS.forEach((k) => {
    if (values[k]) payload[k] = values[k];
  });
  payload.features = String(values.features || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return payload;
}

export default function VehicleForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const { data: locations = [] } = useAdminLocations();
  const vehicleQ = useVehicle(id);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const uploadImages = useUploadVehicleImages();
  const deleteImage = useDeleteVehicleImage();

  const [imageToDelete, setImageToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_DEFAULTS });

  // Prefill once the vehicle loads (edit mode).
  useEffect(() => {
    if (isEdit && vehicleQ.data) reset(toFormValues(vehicleQ.data));
  }, [isEdit, vehicleQ.data, reset]);

  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: l._id, label: `${l.name}${l.city ? ` · ${l.city}` : ''}` })),
    [locations]
  );

  const onSubmit = async (values) => {
    const payload = toPayload(values);
    try {
      if (isEdit) {
        await updateVehicle.mutateAsync({ id, payload });
        toast.success('Vehicle updated');
      } else {
        const created = await createVehicle.mutateAsync(payload);
        toast.success('Vehicle added');
        navigate(created?._id ? ROUTES.adminVehicleEdit(created._id) : ROUTES.adminFleet);
        return;
      }
    } catch (err) {
      const { message, errors: fieldErrors } = extractApiError(err);
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe) => {
          if (fe.field && fe.field in EMPTY_DEFAULTS) setError(fe.field, { message: fe.message });
        });
      }
      toast.error(message);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      await uploadImages.mutateAsync({ id, files });
      toast.success(files.length > 1 ? `${files.length} images uploaded` : 'Image uploaded');
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async () => {
    try {
      await deleteImage.mutateAsync({ id, publicId: imageToDelete.publicId });
      toast.success('Image removed');
      setImageToDelete(null);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  if (isEdit && vehicleQ.isLoading) return <PageLoader label="Loading vehicle" />;
  if (isEdit && vehicleQ.isError) {
    return (
      <ErrorState
        title="Could not load vehicle"
        error={extractApiError(vehicleQ.error).message}
        onRetry={vehicleQ.refetch}
      />
    );
  }

  const images = vehicleQ.data?.images || [];
  const saving = isSubmitting || createVehicle.isPending || updateVehicle.isPending;

  return (
    <>
      <AdminPageHeader
        title={isEdit ? `Edit ${vehicleTitle(vehicleQ.data)}` : 'Add vehicle'}
        description={isEdit ? vehicleQ.data?.registrationNumber : 'Add a new vehicle to your fleet.'}
        backTo={ROUTES.adminFleet}
        backLabel="Fleet"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-semibold text-fg-strong">Vehicle details</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Brand"
              required
              placeholder="Maruti Suzuki"
              error={errors.brand?.message}
              {...register('brand', { required: 'Brand is required' })}
            />
            <Input
              label="Model"
              required
              placeholder="Swift"
              error={errors.model?.message}
              {...register('model', { required: 'Model is required' })}
            />
            <Input label="Variant" placeholder="VXi" error={errors.variant?.message} {...register('variant')} />
            <Input
              label="Registration number"
              required
              placeholder="PB65AB1234"
              error={errors.registrationNumber?.message}
              {...register('registrationNumber', { required: 'Registration number is required' })}
            />
            <Input
              label="Year"
              type="number"
              placeholder="2023"
              error={errors.year?.message}
              {...register('year')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-semibold text-fg-strong">Specifications</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Type"
              required
              placeholder="Select type"
              options={VEHICLE_TYPE_OPTIONS}
              error={errors.vehicleType?.message}
              {...register('vehicleType', { required: 'Type is required' })}
            />
            <Select
              label="Transmission"
              required
              placeholder="Select transmission"
              options={TRANSMISSION_OPTIONS}
              error={errors.transmission?.message}
              {...register('transmission', { required: 'Transmission is required' })}
            />
            <Select
              label="Fuel type"
              required
              placeholder="Select fuel type"
              options={FUEL_TYPE_OPTIONS}
              error={errors.fuelType?.message}
              {...register('fuelType', { required: 'Fuel type is required' })}
            />
            <Input
              label="Seats"
              type="number"
              required
              placeholder="5"
              error={errors.seats?.message}
              {...register('seats', { required: 'Seats is required' })}
            />
            <Input
              label="Luggage capacity"
              type="number"
              hint="Number of bags"
              error={errors.luggageCapacity?.message}
              {...register('luggageCapacity')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-semibold text-fg-strong">Pricing</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Daily price"
              type="number"
              required
              placeholder="1500"
              error={errors.dailyPrice?.message}
              {...register('dailyPrice', { required: 'Daily price is required' })}
            />
            <Input label="Weekly price" type="number" error={errors.weeklyPrice?.message} {...register('weeklyPrice')} />
            <Input label="Monthly price" type="number" error={errors.monthlyPrice?.message} {...register('monthlyPrice')} />
            <Input
              label="Security deposit"
              type="number"
              error={errors.securityDeposit?.message}
              {...register('securityDeposit')}
            />
            <Input
              label="Extra km price"
              type="number"
              hint="Charge per km over the limit"
              error={errors.extraKmPrice?.message}
              {...register('extraKmPrice')}
            />
            <Input
              label="Km/day allowance"
              type="number"
              hint="Included kilometres per day"
              error={errors.kmPerDayAllowance?.message}
              {...register('kmPerDayAllowance')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-semibold text-fg-strong">Location & status</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Location"
              required
              placeholder={locationOptions.length ? 'Select location' : 'No locations yet'}
              options={locationOptions}
              error={errors.locationId?.message}
              {...register('locationId', { required: 'Location is required' })}
            />
            <Select
              label="Status"
              options={VEHICLE_STATUS_FORM_OPTIONS}
              error={errors.status?.message}
              {...register('status')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-semibold text-fg-strong">Service & documents</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Current mileage (km)"
              type="number"
              error={errors.currentMileage?.message}
              {...register('currentMileage')}
            />
            <Input
              label="Next service mileage (km)"
              type="number"
              error={errors.nextServiceMileage?.message}
              {...register('nextServiceMileage')}
            />
            <Input
              label="Last service date"
              type="date"
              error={errors.lastServiceDate?.message}
              {...register('lastServiceDate')}
            />
            <Input
              label="Insurance expiry"
              type="date"
              error={errors.insuranceExpiry?.message}
              {...register('insuranceExpiry')}
            />
            <Input
              label="PUC expiry"
              type="date"
              error={errors.pucExpiry?.message}
              {...register('pucExpiry')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-semibold text-fg-strong">Description & features</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Textarea
              label="Description"
              rows={4}
              placeholder="A comfortable hatchback ideal for city drives and short trips…"
              error={errors.description?.message}
              {...register('description')}
            />
            <Input
              label="Features"
              hint="Comma-separated, e.g. Air conditioning, Bluetooth, Reverse camera"
              placeholder="Air conditioning, Bluetooth, Power steering"
              error={errors.features?.message}
              {...register('features')}
            />
          </CardBody>
        </Card>

        {/* Images live on the vehicle, so uploads are only available after it exists. */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-fg-strong">Photos</h2>
            {isEdit && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={uploadImages.isPending}
                  leftIcon={<Upload className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload
                </Button>
              </>
            )}
          </CardHeader>
          <CardBody>
            {!isEdit ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hair py-10 text-center">
                <ImagePlus className="mb-2 h-7 w-7 text-muted" />
                <p className="text-sm text-muted">Save the vehicle first, then add photos.</p>
              </div>
            ) : images.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <div
                    key={img.publicId || img.url}
                    className="group relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-hair"
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    {img.isPrimary && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink-950/70 px-2 py-0.5 text-[11px] font-medium text-white">
                        <Star className="h-3 w-3 fill-current" /> Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setImageToDelete(img)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/70 text-white opacity-0 transition-opacity hover:bg-red-600 focus:opacity-100 group-hover:opacity-100"
                      title="Remove photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {uploadImages.isPending && (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-hair text-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hair py-10 text-center">
                <ImagePlus className="mb-2 h-7 w-7 text-muted" />
                <p className="text-sm text-muted">No photos yet. Upload a few to show this vehicle at its best.</p>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" to={ROUTES.adminFleet}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Add vehicle'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={!!imageToDelete}
        onClose={() => setImageToDelete(null)}
        onConfirm={handleDeleteImage}
        loading={deleteImage.isPending}
        title="Remove photo?"
        description="This photo will be permanently deleted from the vehicle."
        confirmLabel="Remove"
      />
    </>
  );
}
