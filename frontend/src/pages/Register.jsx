import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/Logo';
import { ROUTES } from '../lib/constants';
import { extractApiError } from '../lib/apiClient';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const from = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : ROUTES.account;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ confirmPassword, ...payload }) => {
    setServerError(null);
    try {
      await registerUser(payload);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(extractApiError(err).message);
    }
  };

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo showWordmark={false} />
          <h1 className="mt-4 font-display text-2xl font-bold text-fg-strong">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted">It only takes a minute.</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-hair bg-card p-6 shadow-card sm:p-8"
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
            label="Full name"
            autoComplete="name"
            placeholder="Jane Doe"
            error={errors.name?.message}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Enter your full name' },
            })}
          />
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
          <Input
            type="tel"
            label="Phone"
            autoComplete="tel"
            placeholder="9876543210"
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Phone is required',
              pattern: { value: /^[0-9+\-\s]{7,15}$/, message: 'Enter a valid phone number' },
            })}
          />
          <Input
            type="password"
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Use at least 8 characters' },
            })}
          />
          <Input
            type="password"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            leftIcon={!isSubmitting ? <UserPlus className="h-4 w-4" /> : undefined}
          >
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link
            to={ROUTES.login}
            state={location.state}
            className="font-semibold text-signal-700 hover:underline dark:text-signal-400"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
