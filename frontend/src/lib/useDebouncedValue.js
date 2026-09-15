import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly-changing value (e.g. a search box) so it only feeds into a
 * query key after the user pauses — avoids a request per keystroke.
 */
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
