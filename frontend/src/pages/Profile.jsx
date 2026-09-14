import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { ChevronLeft, Check, KeyRound, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUpdateProfile } from '../features/users/hooks';
import { authApi } from '../features/auth/api';
import { Button, Input, Card, CardBody } from '../components/ui';
import { ROUTES } from '../lib/constants';
import { extractApiError } from '../lib/apiClient';

export default function Profile() {
  const { user, setUser } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <Link
        to={ROUTES.account}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to my bookings
      </Link>

      <h1 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">Profile</h1>
      <p className="mt-1 text-muted">Manage your personal details and password.</p>

      <div className="mt-8 space-y-6">
        <ProfileDetails user={user} setUser={setUser} />
        <ChangePassword />
      </div>
    </div>
  );
}

function ProfileDetails({ user, setUser }) {
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      line1: user?.address?.line1 || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
    },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    setSaved(false);
    const payload = {
      name: values.name,
      phone: values.phone,
      address: {
        line1: values.line1,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      },
    };
    try {
      const updated = await updateProfile.mutateAsync(payload);
      setUser?.(updated); // keep navbar/greeting in sync
      reset(values); // clears dirty state
      setSaved(true);
    } catch (e) {
      setServerError(extractApiError(e).message);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="mb-5 flex items-center gap-2">
          <UserRound className="h-5 w-5 text-signal-600" />
          <h2 className="font-display text-lg font-semibold text-fg-strong">Personal details</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name is too short' },
              })}
            />
            <Input label="Email" value={user?.email || ''} disabled hint="Email can’t be changed here." />
          </div>

          <Input
            label="Phone"
            type="tel"
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Phone is required',
              minLength: { value: 7, message: 'Enter a valid phone number' },
            })}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-fg-strong">Address</p>
            <div className="grid gap-4">
              <Input label="Address line" {...register('line1')} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="City" {...register('city')} />
                <Input label="State" {...register('state')} />
                <Input label="PIN code" {...register('pincode')} />
              </div>
            </div>
          </div>

          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={updateProfile.isPending} disabled={!isDirty}>
              Save changes
            </Button>
            {saved && !isDirty && (
              <span className="flex items-center gap-1.5 text-sm text-route-700 dark:text-route-300">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function ChangePassword() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const changePassword = useMutation({
    mutationFn: (payload) => authApi.changePassword(payload),
  });

  const onSubmit = async (values) => {
    setServerError(null);
    setDone(false);
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setDone(true);
    } catch (e) {
      setServerError(extractApiError(e).message);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="mb-5 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-signal-600" />
          <h2 className="font-display text-lg font-semibold text-fg-strong">Change password</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            type="password"
            label="Current password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword', { required: 'Enter your current password' })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="password"
              label="New password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword', {
                required: 'Enter a new password',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
            <Input
              type="password"
              label="Confirm new password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Re-enter your new password',
                validate: (v) => v === watch('newPassword') || 'Passwords don’t match',
              })}
            />
          </div>

          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={changePassword.isPending}>
              Update password
            </Button>
            {done && (
              <span className="flex items-center gap-1.5 text-sm text-route-700 dark:text-route-300">
                <Check className="h-4 w-4" /> Password updated
              </span>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
