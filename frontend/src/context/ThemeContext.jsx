import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Theme: light / dark with a class strategy (`.dark` on <html>).
 *
 * Order of precedence:
 *   1. A manual choice the user made (saved in localStorage) always wins.
 *   2. Otherwise follow the OS `prefers-color-scheme`, live.
 *
 * The inline script in index.html already applied the correct class before the
 * first paint (no flash); this provider keeps React in sync and handles toggling.
 */

const ThemeContext = createContext(null);
const STORAGE_KEY = 'theme';

function currentDomTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage blocked — the class still applies for this session */
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(currentDomTheme);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    applyTheme(next);
    writeStored(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      writeStored(next);
      return next;
    });
  }, []);

  // Follow the OS setting live — but only while the user hasn't chosen manually.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (readStored()) return; // manual choice wins
      const next = e.matches ? 'dark' : 'light';
      setThemeState(next);
      applyTheme(next);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
