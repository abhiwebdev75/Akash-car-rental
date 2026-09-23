import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { KeyRound } from 'lucide-react';
import { authApi } from '../features/auth/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthBackdrop, AuthTrustNote } from '../components/AuthBackdrop';
import { Logo } from '../components/Logo';
import { ROUTES } from '../lib/constants';
import { extractApiError } from '../lib/apiClient';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(email);
      // The API responds the same whether or not the email exists (no
      // enumeration). Move straight to the reset-code screen either way.
      navigate(ROUTES.resetPassword, { state: { email } });
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
          <h1 className="mt-4 font-display text-2xl font-bold text-fg-strong">Forgot password</h1>
          <p className="mt-1.5 text-sm text-muted">
            Enter your email and we'll send a code to reset your password.
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
            type="email"
            label="Email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
            })}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            leftIcon={!isSubmitting ? <KeyRound className="h-4 w-4" /> : undefined}
          >
            Send reset code
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Remembered it?{' '}
          <Link to={ROUTES.login} className="font-semibold text-signal-700 hover:underline dark:text-signal-400">
            Back to log in
          </Link>
        </p>

        <AuthTrustNote />
      </div>
    </div>
  );
}
