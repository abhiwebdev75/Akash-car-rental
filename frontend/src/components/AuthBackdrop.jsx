import { ShieldCheck } from 'lucide-react';

/**
 * Decorative full-bleed backdrop for the auth pages (login / register / verify /
 * reset). Sits behind the card via absolute positioning: a navy gradient base,
 * two softly-animated gradient orbs (signal + route), a dashed route-line motif,
 * and a faint grid. All decorative, so it's aria-hidden and pointer-events-none.
 *
 * Render it as the first child of a `relative` container that also holds the
 * form card.
 */
export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base wash — subtle in light mode, deep navy in dark. */}
      <div className="absolute inset-0 bg-gradient-to-br from-route/5 via-transparent to-signal/5 dark:from-ink-900 dark:via-ink-800 dark:to-ink-900" />

      {/* Gradient orbs */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-route/20 blur-3xl animate-fade-in dark:bg-route/25" />
      <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-signal/20 blur-3xl animate-fade-in dark:bg-signal/20" />

      {/* Route-line motif */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.5] dark:opacity-[0.25]"
        viewBox="0 0 800 600"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-40 480 C 200 480, 240 200, 460 200 S 760 120, 860 120"
          className="stroke-route/40"
          strokeWidth="2"
          strokeDasharray="2 12"
          strokeLinecap="round"
        />
        <path
          d="M-40 540 C 240 540, 300 320, 540 320 S 820 240, 900 200"
          className="stroke-signal/40"
          strokeWidth="2"
          strokeDasharray="2 14"
          strokeLinecap="round"
        />
        <circle cx="460" cy="200" r="5" className="fill-route" />
        <circle cx="540" cy="320" r="5" className="fill-signal" />
      </svg>
    </div>
  );
}

/**
 * A slim trust strip shown under the auth card — a light, reassuring footer that
 * fills the otherwise-empty space without competing with the form.
 */
export function AuthTrustNote() {
  return (
    <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
      <ShieldCheck className="h-3.5 w-3.5 text-route" />
      Your details are encrypted and never shared.
    </p>
  );
}
