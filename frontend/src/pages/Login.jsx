import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { AuthBackdrop, AuthTrustNote } from '../components/AuthBackdrop';
import { Logo } from '../components/Logo';
import { ROUTES } from '../lib/constants';
import { extractApiError } from '../lib/apiClient';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const notice = location.state?.notice;

  const from = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : ROUTES.account;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      const parsed = extractApiError(err);
      // Unverified accounts: the backend has re-sent a code — take them to verify.
      if (parsed.code === 'EMAIL_NOT_VERIFIED') {
        navigate(ROUTES.verifyEmail, {
          state: { email: values.email, from: location.state?.from },
        });
        return;
      }
      setServerError(parsed.message);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <AuthBackdrop />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo showWordmark={false} />
          <h1 className="mt-4 font-display text-2xl font-bold text-fg-strong">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted">Log in to manage your bookings.</p>
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
          {!serverError && notice && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3.5 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
              {notice}
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
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />

          <div className="flex justify-end">
            <Link
              to={ROUTES.forgotPassword}
              className="text-sm font-medium text-signal-700 hover:underline dark:text-signal-400"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            leftIcon={!isSubmitting ? <LogIn className="h-4 w-4" /> : undefined}
          >
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link
            to={ROUTES.register}
            state={location.state}
            className="font-semibold text-signal-700 hover:underline dark:text-signal-400"
          >
            Create an account
          </Link>
        </p>

        <AuthTrustNote />
      </div>
    </div>
  );
}
