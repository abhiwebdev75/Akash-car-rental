// Drop empty/undefined values so we never send `?locationId=&minPrice=` noise to
// the API, and skip empty arrays. Keeps query keys stable for caching too.
export function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  });
  return out;
}
