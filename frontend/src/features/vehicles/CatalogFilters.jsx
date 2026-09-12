import { SlidersHorizontal, X } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  VEHICLE_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  FUEL_TYPE_OPTIONS,
} from '../../lib/constants';

const SEAT_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '2', label: '2+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
  { value: '7', label: '7+' },
];

/**
 * Catalog filter controls. Fully controlled — `values` comes from the URL query
 * (single source of truth) and every change calls `onChange(key, value)`.
 * `activeCount` drives the "clear" affordance.
 */
export function CatalogFilters({ values, onChange, onClear, activeCount = 0 }) {
  const change = (key) => (e) => onChange(key, e.target.value);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg-strong">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-medium text-signal-700 hover:underline dark:text-signal-400"
          >
            <X className="h-3.5 w-3.5" />
            Clear ({activeCount})
          </button>
        )}
      </div>

      <Select
        label="Vehicle type"
        value={values.type}
        onChange={change('type')}
        options={[{ value: '', label: 'All types' }, ...VEHICLE_TYPE_OPTIONS]}
      />
      <Select
        label="Transmission"
        value={values.transmission}
        onChange={change('transmission')}
        options={[{ value: '', label: 'Any' }, ...TRANSMISSION_OPTIONS]}
      />
      <Select
        label="Fuel type"
        value={values.fuel}
        onChange={change('fuel')}
        options={[{ value: '', label: 'Any' }, ...FUEL_TYPE_OPTIONS]}
      />
      <Select
        label="Seats"
        value={values.minSeats}
        onChange={change('minSeats')}
        options={SEAT_OPTIONS}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-fg-strong">Price / day</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            value={values.minPrice}
            onChange={change('minPrice')}
            aria-label="Minimum price per day"
          />
          <span className="text-muted">–</span>
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            value={values.maxPrice}
            onChange={change('maxPrice')}
            aria-label="Maximum price per day"
          />
        </div>
      </div>

      {activeCount > 0 && (
        <Button variant="secondary" fullWidth size="sm" onClick={onClear}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
