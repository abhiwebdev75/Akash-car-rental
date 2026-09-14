// Small presentational helpers shared by every screen that shows a vehicle
// (catalog, detail, booking flow, account). The backend exposes `title` and
// `primaryImage` virtuals, but bookings populate a subset of fields, so we fall
// back gracefully to brand/model/variant and the images array.

export function vehicleTitle(v) {
  if (!v) return '';
  return v.title || [v.brand, v.model, v.variant].filter(Boolean).join(' ');
}

export function vehicleImage(v) {
  const p = v?.primaryImage;
  if (typeof p === 'string') return p;
  if (p?.url) return p.url;
  const first = v?.images?.[0];
  if (typeof first === 'string') return first;
  return first?.url || null;
}
