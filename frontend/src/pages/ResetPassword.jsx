import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '../features/auth/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { AuthBackdrop, AuthTrustNote } from '../components/AuthBackdrop';
import { Logo } from '../components/Logo';
import { ROUTES } from '../lib/constants';
import { extractApiError } from '../lib/apiClient';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [serverError, setServerError] = useState(null);

  // Reached this page without an email in state — send them to request a code.
  useEffect(() => {
    if (!email) navigate(ROUTES.forgotPassword, { replace: true });
  }, [email, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { code: '', newPassword: '', confirmPassword: '' } });

  const onSubmit = async ({ code, newPassword }) => {
    setServerError(null);
    try {
      await authApi.resetPassword({ email, code, newPassword });
      navigate(ROUTES.login, {
        replace: true,
        state: { notice: 'Password reset. Please log in with your new password.' },
      });
    } catch (err) {
      setServerError(extractApiError(err).message);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <AuthBackdrop />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo showWordmark={false} />
          <h1 className="mt-4 font-display text-2xl font-bold text-fg-strong">Reset password</h1>
          <p className="mt-1.5 text-sm text-muted">
            Enter the code sent to <span className="font-medium text-fg-strong">{email}</span> and choose a new password.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-hair bg-card/95 p-6 shadow-pop backdrop-blur-sm sm:p-8"
          noValidate
        >
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300"
            >
              {serverError}
            </div>
          )}

          <Input
            label="Reset code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            className="tracking-[0.5em] text-center text-lg"
            error={errors.code?.message}
            {...register('code', {
              required: 'Enter the 6-digit code',
              pattern: { value: /^\d{6}$/, message: 'The code is 6 digits' },
            })}
          />
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Use at least 8 characters' },
            })}
          />
          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === watch('newPassword') || 'Passwords do not match',
            })}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            leftIcon={!isSubmitting ? <ShieldCheck className="h-4 w-4" /> : undefined}
          >
            Reset password
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Didn't get a code?{' '}
          <Link to={ROUTES.forgotPassword} className="font-semibold text-signal-700 hover:underline dark:text-signal-400">
            Request again
          </Link>
        </p>

        <AuthTrustNote />
      </div>
    </div>
  );
}
