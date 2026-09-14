import { useCallback, useMemo, useSyncExternalStore } from 'react';

// A tiny cross-component store for the "compare" tray, persisted to
// localStorage so the selection survives navigation and reloads. Kept out of
// React Query because it's pure client UI state, not server data.
const KEY = 'compare:v1';
const MAX = 4;

const listeners = new Set();

function readRaw() {
  try {
    return localStorage.getItem(KEY) || '[]';
  } catch {
    return '[]';
  }
}

function readIds() {
  try {
    const parsed = JSON.parse(readRaw());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota/availability errors */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb) {
  listeners.add(cb);
  window.addEventListener('storage', cb); // sync across tabs
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

export function useCompare() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => '[]');
  const ids = useMemo(() => {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }, [raw]);

  const has = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback((id) => {
    const cur = readIds();
    if (cur.includes(id)) write(cur.filter((x) => x !== id));
    else if (cur.length < MAX) write([...cur, id]);
  }, []);

  const remove = useCallback((id) => write(readIds().filter((x) => x !== id)), []);
  const clear = useCallback(() => write([]), []);

  return { ids, count: ids.length, has, toggle, remove, clear, max: MAX, isFull: ids.length >= MAX };
}
