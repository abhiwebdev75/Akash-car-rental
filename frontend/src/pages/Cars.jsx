import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CarFront, SlidersHorizontal, X } from 'lucide-react';
import { CatalogFilters } from '../features/vehicles/CatalogFilters';
import { VehicleCard, VehicleCardSkeleton } from '../features/vehicles/VehicleCard';
import { useVehicles, useAvailability } from '../features/vehicles/hooks';
import { useLocations } from '../features/locations/hooks';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { SORT_OPTIONS } from '../lib/constants';
import { combineDateTimeISO, isValidRange, todayInput } from '../lib/datetime';
import { formatDate, pluralize } from '../lib/formatters';

const PAGE_SIZE = 12;
const FILTER_KEYS = ['type', 'transmission', 'fuel', 'minSeats', 'minPrice', 'maxPrice'];

function sortItems(items, sort) {
  if (!sort) return items;
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = Number(a[key]) || 0;
    const bv = Number(b[key]) || 0;
    return desc ? bv - av : av - bv;
  });
}

export default function Cars() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: locations = [] } = useLocations();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const get = (k, d = '') => searchParams.get(k) ?? d;

  const trip = {
    locationId: get('locationId'),
    pickupDate: get('pickupDate'),
    pickupTime: get('pickupTime', '10:00'),
    returnDate: get('returnDate'),
    returnTime: get('returnTime', '10:00'),
  };
  const filters = {
    type: get('type'),
    transmission: get('transmission'),
    fuel: get('fuel'),
    minSeats: get('minSeats'),
    minPrice: get('minPrice'),
    maxPrice: get('maxPrice'),
  };
  const sort = get('sort');
  const page = Number(get('page', '1')) || 1;

  const hasRange =
    !!trip.pickupDate &&
    !!trip.returnDate &&
    isValidRange(trip.pickupDate, trip.pickupTime, trip.returnDate, trip.returnTime);

  const start = hasRange ? combineDateTimeISO(trip.pickupDate, trip.pickupTime) : null;
  const end = hasRange ? combineDateTimeISO(trip.returnDate, trip.returnTime) : null;

  // Shared filter params (backend field names).
  const filterParams = {
    locationId: trip.locationId || undefined,
    vehicleType: filters.type || undefined,
    transmission: filters.transmission || undefined,
    fuelType: filters.fuel || undefined,
    minSeats: filters.minSeats || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
  };

  const browseQ = useVehicles(
    { ...filterParams, sort: sort || undefined, page, limit: PAGE_SIZE },
    { enabled: !hasRange }
  );
  const availQ = useAvailability({ start, end, ...filterParams }, { enabled: hasRange });

  const active = hasRange ? availQ : browseQ;
  const rawItems = active.data?.items || [];
  const meta = active.data?.meta;
  const items = useMemo(
    () => (hasRange ? sortItems(rawItems, sort) : rawItems),
    [hasRange, rawItems, sort]
  );

  const activeFilterCount = FILTER_KEYS.filter((k) => searchParams.get(k)).length;

  // --- URL updates ---
  const updateParams = (patch, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, v);
    });
    if (resetPage) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const onFilterChange = (key, value) => updateParams({ [key]: value });
  const clearFilters = () =>
    updateParams(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])));
  const clearDates = () =>
    updateParams({ pickupDate: '', returnDate: '', pickupTime: '', returnTime: '' });

  const onTripDate = (key) => (e) => {
    const value = e.target.value;
    if (key === 'pickupDate') {
      const patch = { pickupDate: value };
      if (trip.returnDate && trip.returnDate < value) patch.returnDate = value;
      updateParams(patch);
    } else {
      updateParams({ [key]: value });
    }
  };

  const resultCount = hasRange ? items.length : meta?.total ?? items.length;

  return (
    <div className="container-page py-8 lg:py-10">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-fg-strong">Browse cars</h1>
        <p className="mt-1.5 text-sm text-muted">
          {hasRange
            ? 'Showing cars available for your selected dates.'
            : 'Explore the full fleet, or pick dates to see live availability.'}
        </p>
      </div>

      {/* Trip bar */}
      <div className="mb-6 rounded-xl border border-hair bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Location"
            value={trip.locationId}
            onChange={(e) => updateParams({ locationId: e.target.value })}
            options={[
              { value: '', label: 'Any location' },
              ...locations.map((l) => ({
                value: l._id,
                label: l.city ? `${l.name} — ${l.city}` : l.name,
              })),
            ]}
          />
          <Input type="date" label="Pick-up" min={todayInput()} value={trip.pickupDate} onChange={onTripDate('pickupDate')} />
          <Input type="date" label="Return" min={trip.pickupDate || todayInput()} value={trip.returnDate} onChange={onTripDate('returnDate')} />
          <Input type="time" label="Pick-up time" value={trip.pickupTime} onChange={onTripDate('pickupTime')} />
          <Input type="time" label="Return time" value={trip.returnTime} onChange={onTripDate('returnTime')} />
        </div>
        {trip.pickupDate && trip.returnDate && !hasRange && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Return must be after pick-up to check availability.
          </p>
        )}
        {hasRange && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="success" dot>
              Availability: {formatDate(trip.pickupDate)} → {formatDate(trip.returnDate)}
            </Badge>
            <button
              type="button"
              onClick={clearDates}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg-strong"
            >
              <X className="h-3.5 w-3.5" />
              Clear dates
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-hair bg-card p-5">
            <CatalogFilters
              values={filters}
              onChange={onFilterChange}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </aside>

        {/* Results */}
        <section>
          {/* Toolbar */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {active.isLoading ? 'Searching…' : pluralize(resultCount, 'car')}
              {activeFilterCount > 0 && !active.isLoading && ' match your filters'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                onClick={() => setMobileFiltersOpen(true)}
              >
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>
              <Select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                options={[{ value: '', label: 'Sort: featured' }, ...SORT_OPTIONS]}
                className="h-9 w-auto"
                aria-label="Sort results"
              />
            </div>
          </div>

          {/* States */}
          {active.isError ? (
            <ErrorState error={active.error} onRetry={active.refetch} />
          ) : active.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={hasRange ? CarFront : SlidersHorizontal}
              title={hasRange ? 'No cars available for these dates' : 'No cars match your filters'}
              description={
                hasRange
                  ? 'Try adjusting your dates or location to find available vehicles.'
                  : 'Try removing a filter or two to see more of the fleet.'
              }
              action={
                hasRange ? (
                  <Button variant="secondary" size="sm" onClick={clearDates}>
                    Browse all cars
                  </Button>
                ) : activeFilterCount > 0 ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((v) => (
                  <VehicleCard key={v._id} vehicle={v} search={searchParams.toString()} />
                ))}
              </div>

              {/* Pagination (browse mode only — availability returns the full set) */}
              {!hasRange && meta?.totalPages > 1 && (
                <Pagination
                  className="mt-10"
                  page={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(p) => updateParams({ page: String(p) }, { resetPage: false })}
                />
              )}
            </>
          )}
        </section>
      </div>

      {/* Mobile filters modal */}
      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={clearFilters} disabled={activeFilterCount === 0}>
              Clear
            </Button>
            <Button variant="primary" onClick={() => setMobileFiltersOpen(false)}>
              Show {pluralize(resultCount, 'car')}
            </Button>
          </>
        }
      >
        <CatalogFilters
          values={filters}
          onChange={onFilterChange}
          onClear={clearFilters}
          activeCount={activeFilterCount}
        />
      </Modal>
    </div>
  );
}
