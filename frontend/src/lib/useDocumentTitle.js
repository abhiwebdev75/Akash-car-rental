import { useEffect } from 'react';

const BRAND = 'Akash Car Rental';

/**
 * Sets `document.title` while the calling component is mounted and restores the
 * previous title on unmount. Pass just the page name — the brand suffix is
 * appended automatically (pass `withBrand: false` to opt out).
 */
export function useDocumentTitle(title, { withBrand = true } = {}) {
  useEffect(() => {
    const previous = document.title;
    const next = !title ? BRAND : withBrand ? `${title} · ${BRAND}` : title;
    document.title = next;
    return () => {
      document.title = previous;
    };
  }, [title, withBrand]);
}

export { BRAND };
