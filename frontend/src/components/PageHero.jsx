/**
 * Dark hero band shared by the marketing/legal pages (About, Contact, Terms,
 * Privacy) so they share the storefront's look. The dashed "route" motif echoes
 * the home hero. Purely presentational.
 */
export function PageHero({ eyebrow, title, subtitle, align = 'left' }) {
  const centered = align === 'center';
  return (
    <section className="relative overflow-hidden border-b border-hair bg-ink-900">
      <HeroBackdrop />
      <div className="container-page relative py-14 sm:py-16 lg:py-20">
        <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
          {eyebrow && (
            <span
              className={[
                'inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15',
                centered ? 'justify-center' : '',
              ].join(' ')}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-route" />
              {eyebrow}
            </span>
          )}
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Subtle route-line motif — curved dashed paths + stops. */
function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900" />
      <svg
        className="absolute right-0 top-0 h-full w-2/3 opacity-[0.15]"
        viewBox="0 0 600 400"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-20 360 C 160 360, 180 120, 360 120 S 560 40, 640 40"
          stroke="#0FB5A6"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        <path
          d="M-20 300 C 200 300, 240 200, 420 200 S 620 160, 700 120"
          stroke="#F2A007"
          strokeWidth="2"
          strokeDasharray="2 12"
          strokeLinecap="round"
        />
        <circle cx="360" cy="120" r="5" fill="#0FB5A6" />
        <circle cx="420" cy="200" r="5" fill="#F2A007" />
      </svg>
    </div>
  );
}
