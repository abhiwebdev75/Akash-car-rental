import clsx from 'clsx';

// Thin wrapper over clsx so every component imports class-merging from one place
// (and we can swap in tailwind-merge later without touching call sites).
export function cn(...inputs) {
  return clsx(inputs);
}
