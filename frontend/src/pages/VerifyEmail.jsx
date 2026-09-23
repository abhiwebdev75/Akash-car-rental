import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../features/auth/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthBackdrop, AuthTrustNote } from '../components/AuthBackdrop';
import { Logo } from '../components/Logo';
import { ROUTES } from '../lib/constants';
import { extractApiError } from '../lib/apiClient';

const RESEND_SECONDS = 60;

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Email is passed from Register/Login via navigation state. Without it we
  // can't verify, so bounce back to registration.
  const email = location.state?.email || '';
  const from = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : ROUTES.account;

  const [serverError, setServerError] = useState(null);
  const [notice, setNotice] = useState('We sent a 6-digit code to your email.');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!email) navigate(ROUTES.register, { replace: true });
  }, [email, navigate]);

  // Countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { code: '' } });

  const onSubmit = async ({ code }) => {
    setServerError(null);
    try {
      await verifyEmail({ email, code });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(extractApiError(err).message);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setServerError(null);
    try {
      await authApi.resendVerification(email);
      setNotice('A new code is on its way. Check your inbox.');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setServerError(extractApiError(err).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <AuthBackdrop />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo showWordmark={false} />
          <h1 className="mt-4 font-display text-2xl font-bold text-fg-strong">Verify your email</h1>
          <p className="mt-1.5 text-sm text-muted">
            Enter the code we sent to <span className="font-medium text-fg-strong">{email}</span>.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-hair bg-card/95 p-6 shadow-pop backdrop-blur-sm sm:p-8"
          noValidate
        >
          {serverError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/8 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300"
            >
              {serverError}
            </div>
          ) : (
            notice && (
              <div className="rounded-lg border border-hair bg-surface/60 px-3.5 py-2.5 text-sm text-muted">
                {notice}
              </div>
            )
          )}

          <Input
            label="Verification code"
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

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            leftIcon={!isSubmitting ? <MailCheck className="h-4 w-4" /> : undefined}
          >
            Verify & continue
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg-strong disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Wrong email?{' '}
          <Link to={ROUTES.register} className="font-semibold text-signal-700 hover:underline dark:text-signal-400">
            Start over
          </Link>
        </p>

        <AuthTrustNote />
      </div>
    </div>
  );
}
