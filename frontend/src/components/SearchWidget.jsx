import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, MapPin, Search } from 'lucide-react';
import { useLocations } from '../features/locations/hooks';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { ROUTES } from '../lib/constants';
import { addDays, isValidRange, todayInput } from '../lib/datetime';
import { cn } from '../lib/cn';

// Half-hour pickup slots (06:00–21:30) — cleaner than a free-form time input.
const TIME_SLOTS = (() => {
  const out = [];
  for (let h = 6; h <= 21; h += 1) {
    for (const m of [0, 30]) {
      const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const period = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      out.push({ value: v, label: `${h12}:${String(m).padStart(2, '0')} ${period}` });
    }
  }
  return out;
})();

/**
 * Hero booking widget. Collects location + pickup/return date-times and routes
 * to the catalog with those as query params, where availability is fetched from
 * the backend. It never checks availability itself — it just gathers intent.
 */
export function SearchWidget({ className, variant = 'hero' }) {
  const navigate = useNavigate();
  const { data: locations = [], isLoading } = useLocations();

  const [form, setForm] = useState(() => ({
    locationId: '',
    pickupDate: todayInput(),
    pickupTime: '10:00',
    returnDate: addDays(todayInput(), 3),
    returnTime: '10:00',
  }));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const rangeOk = isValidRange(form.pickupDate, form.pickupTime, form.returnDate, form.returnTime);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!rangeOk) return;
    const params = new URLSearchParams();
    if (form.locationId) params.set('locationId', form.locationId);
    params.set('pickupDate', form.pickupDate);
    params.set('pickupTime', form.pickupTime);
    params.set('returnDate', form.returnDate);
    params.set('returnTime', form.returnTime);
    navigate({ pathname: ROUTES.cars, search: `?${params.toString()}` });
  };

  const locationOptions = [
    { value: '', label: isLoading ? 'Loading locations…' : 'Any location' },
    ...locations.map((l) => ({ value: l._id, label: l.city ? `${l.name} — ${l.city}` : l.name })),
  ];

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'rounded-2xl border border-hair bg-card/95 p-4 shadow-pop backdrop-blur-sm sm:p-5',
        className
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <Select
            label="Pick-up location"
            options={locationOptions}
            value={form.locationId}
            onChange={set('locationId')}
          />
        </div>

        <Input
          type="date"
          label="Pick-up date"
          min={todayInput()}
          value={form.pickupDate}
          onChange={(e) => {
            const pickupDate = e.target.value;
            setForm((f) => ({
              ...f,
              pickupDate,
              // keep return on/after pickup
              returnDate: f.returnDate < pickupDate ? pickupDate : f.returnDate,
            }));
          }}
        />
        <Select label="Pick-up time" options={TIME_SLOTS} value={form.pickupTime} onChange={set('pickupTime')} />
        <Input
          type="date"
          label="Return date"
          min={form.pickupDate}
          value={form.returnDate}
          onChange={set('returnDate')}
        />
        <Select label="Return time" options={TIME_SLOTS} value={form.returnTime} onChange={set('returnTime')} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            'flex items-center gap-1.5 text-xs',
            rangeOk ? 'text-muted' : 'text-red-600 dark:text-red-400'
          )}
        >
          {rangeOk ? (
            <>
              <CalendarRange className="h-3.5 w-3.5" />
              We’ll show cars available for your dates.
            </>
          ) : (
            <>Return must be after pick-up.</>
          )}
        </p>
        <Button
          type="submit"
          size="lg"
          disabled={!rangeOk}
          leftIcon={<Search className="h-4 w-4" />}
          className="sm:min-w-[180px]"
        >
          Search cars
        </Button>
      </div>
    </form>
  );
}
