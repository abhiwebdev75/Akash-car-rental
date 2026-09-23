import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

const ADVANCE_MS = 5000;

/**
 * Rotating image backdrop for the hero. Cycles through a set of slides with a
 * crossfade + slow zoom, a dark gradient overlay so foreground text stays
 * readable, dot indicators and prev/next controls. Auto-advances, pauses on
 * hover/focus, and respects `prefers-reduced-motion` (no auto-advance, no zoom).
 *
 * `slides` is an array of { url, label? }. When empty, the parent should render
 * its own fallback backdrop instead of mounting this.
 */
export function HeroCarousel({ slides = [], className }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const count = slides.length;

  const go = useCallback(
    (next) => setIndex((i) => (next + count) % count),
    [count],
  );

  // Auto-advance unless paused, reduced-motion, or there's nothing to rotate.
  useEffect(() => {
    if (paused || reducedMotion || count < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, reducedMotion, count]);

  // Keep the active index valid if the slide set shrinks.
  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.url + i}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-out',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
        >
          <img
            src={slide.url}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            className={cn(
              'h-full w-full object-cover',
              i === index && !reducedMotion && 'animate-fade-zoom',
            )}
          />
        </div>
      ))}

      {/* Readability overlay — darkest at the left where the headline sits. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/95 via-ink-900/80 to-ink-900/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />

      {count > 1 && (
        <>
          {/* Prev / next — interactive, so re-enable pointer events on the controls only. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-between px-4 sm:bottom-6 sm:px-6">
            <div className="pointer-events-auto flex gap-2">
              <CarouselButton label="Previous car" onClick={() => go(index - 1)}>
                <ChevronLeft className="h-5 w-5" />
              </CarouselButton>
              <CarouselButton label="Next car" onClick={() => go(index + 1)}>
                <ChevronRight className="h-5 w-5" />
              </CarouselButton>
            </div>

            {/* Dots */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === index ? 'w-6 bg-signal' : 'w-1.5 bg-white/40 hover:bg-white/70',
                  )}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CarouselButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
    >
      {children}
    </button>
  );
}

/** Tracks the user's reduced-motion preference reactively. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}
