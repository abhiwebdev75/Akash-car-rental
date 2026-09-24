import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { BRAND } from '../lib/useDocumentTitle';
import { ROUTE_SEO, SITE } from '../lib/seo';

/**
 * Single source of truth for per-route SEO. Mounted once at the app root, it
 * sets the document title and upserts the meta description, canonical link, and
 * Open Graph / Twitter tags whenever the route changes — plus a robots
 * `noindex` on private pages (login, account, booking) so they stay out of
 * search results.
 *
 * This runs client-side; crawlers that execute JS will pick these up. The
 * static defaults in index.html cover crawlers that don't, and the JSON-LD
 * there provides the local-business structured data. For the strongest ranking
 * a prerender/SSR step is still recommended (see notes shared with the owner).
 */
function resolve(pathname) {
  for (const entry of ROUTE_SEO) {
    if (matchPath({ path: entry.path, end: entry.end ?? false }, pathname)) return entry;
  }
  return null;
}

/** Create or update a <meta> tag keyed by name or property. */
function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = resolve(pathname);
    const title = meta?.title ? `${meta.title} · ${BRAND}` : BRAND;
    const description = meta?.description || SITE.description;
    const canonical = `${SITE.url}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertLink('canonical', canonical);

    // Private/utility pages should not be indexed.
    upsertMeta('name', 'robots', meta?.noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE.name);

    // Twitter
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
  }, [pathname]);

  return null;
}
