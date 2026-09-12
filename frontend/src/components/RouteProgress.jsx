import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/cn';

/**
 * Thin top progress bar shown briefly on each route change — a lightweight
 * perceived-performance cue while lazy page chunks resolve. Purely visual;
 * animates from 0 → ~90% then completes and fades.
 */
export function RouteProgress() {
  const { pathname } = useLocation();
  const [state, setState] = useState({ active: false, width: 0 });

  useEffect(() => {
    let done;
    let finish;
    setState({ active: true, width: 12 });
    const grow = setTimeout(() => setState({ active: true, width: 88 }), 60);
    done = setTimeout(() => setState({ active: true, width: 100 }), 320);
    finish = setTimeout(() => setState({ active: false, width: 0 }), 620);

    return () => {
      clearTimeout(grow);
      clearTimeout(done);
      clearTimeout(finish);
    };
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5" aria-hidden="true">
      <div
        className={cn(
          'h-full bg-signal shadow-signal transition-[width,opacity] ease-out',
          state.active ? 'opacity-100 duration-300' : 'opacity-0 duration-200'
        )}
        style={{ width: `${state.width}%` }}
      />
    </div>
  );
}
