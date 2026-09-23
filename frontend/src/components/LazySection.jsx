import { useEffect, useRef, useState } from 'react';

/**
 * Defers rendering of its children until the placeholder scrolls near the
 * viewport (via IntersectionObserver), then keeps them mounted. Useful for
 * below-the-fold homepage sections so their work — data fetching, images,
 * heavier subtrees — doesn't happen on first paint.
 *
 * A `minHeight` placeholder reserves space to avoid layout shift when the
 * content mounts. Falls back to rendering immediately if IntersectionObserver
 * is unavailable.
 */
export function LazySection({ children, minHeight = 320, rootMargin = '200px', className }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown, rootMargin]);

  return (
    <div ref={ref} className={className} style={shown ? undefined : { minHeight }}>
      {shown ? children : null}
    </div>
  );
}
