import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Car, GitCompareArrows, Trash2, X } from 'lucide-react';
import { vehiclesApi } from '../features/vehicles/api';
import { useSettings } from '../features/settings/hooks';
import { useCompare } from '../lib/useCompare';
import { vehicleImage, vehicleTitle } from '../features/vehicles/display';
import { Button, Card, CardBody, EmptyState, Skeleton, Badge } from '../components/ui';
import {
  ROUTES,
  VEHICLE_TYPE_LABELS,
  TRANSMISSION_LABELS,
  FUEL_TYPE_LABELS,
} from '../lib/constants';
import { formatMoney } from '../lib/formatters';

export default function Compare() {
  const { ids, remove, clear } = useCompare();
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['vehicles', 'detail', id],
      queryFn: () => vehiclesApi.getById(id),
      enabled: !!id,
    })),
  });

  const loading = results.some((r) => r.isLoading);
  const vehicles = results.map((r) => r.data).filter(Boolean);

  const ROWS = [
    { label: 'Price / day', render: (v) => <strong className="text-fg-strong">{formatMoney(v.dailyPrice, currency)}</strong> },
    { label: 'Type', render: (v) => VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType },
    { label: 'Seats', render: (v) => v.seats },
    { label: 'Transmission', render: (v) => TRANSMISSION_LABELS[v.transmission] || v.transmission },
    { label: 'Fuel', render: (v) => FUEL_TYPE_LABELS[v.fuelType] || v.fuelType },
    { label: 'Luggage', render: (v) => (v.luggageCapacity ? `${v.luggageCapacity} bags` : '—') },
    { label: 'Year', render: (v) => v.year || '—' },
    { label: 'Security deposit', render: (v) => formatMoney(v.securityDeposit || 0, currency) },
    {
      label: 'Features',
      render: (v) =>
        v.features?.length ? (
          <ul className="flex flex-wrap gap-1">
            {v.features.map((f) => (
              <Badge key={f} tone="muted" size="sm">
                {f}
              </Badge>
            ))}
          </ul>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg-strong sm:text-3xl">Compare cars</h1>
          <p className="mt-1 text-muted">Line up the details side by side to find your best fit.</p>
        </div>
        {ids.length > 0 && (
          <Button variant="ghost" onClick={clear} leftIcon={<Trash2 className="h-4 w-4" />}>
            Clear all
          </Button>
        )}
      </div>

      {ids.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={GitCompareArrows}
            title="Nothing to compare yet"
            description="Add cars to compare from any car’s detail page, then come back here to see them side by side."
            action={<Button to={ROUTES.cars}>Browse cars</Button>}
          />
        </div>
      ) : loading ? (
        <Skeleton className="mt-8 h-96 w-full rounded-2xl" />
      ) : (
        <Card className="mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-32 bg-card p-4 text-left align-bottom" />
                  {vehicles.map((v) => (
                    <th key={v._id} className="min-w-[200px] border-l border-hair p-4 align-top">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => remove(v._id)}
                          aria-label={`Remove ${vehicleTitle(v)}`}
                          className="absolute -right-1 -top-1 rounded-full bg-ink-900/5 p-1 text-muted transition-colors hover:bg-ink-900/10 hover:text-fg-strong dark:bg-white/10 dark:hover:bg-white/20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-paper">
                          {vehicleImage(v) ? (
                            <img src={vehicleImage(v)} alt={vehicleTitle(v)} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted">
                              <Car className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-left font-display font-bold text-fg-strong">{vehicleTitle(v)}</p>
                        <div className="mt-2 flex flex-col gap-2">
                          <Button to={ROUTES.vehicle(v._id)} size="sm" variant="secondary" fullWidth>
                            View
                          </Button>
                          <Button to={ROUTES.book(v._id)} size="sm" fullWidth>
                            Book
                          </Button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 ? 'bg-paper' : 'bg-card'}>
                    <th className="sticky left-0 z-10 whitespace-nowrap bg-inherit p-4 text-left align-top font-medium text-muted">
                      {row.label}
                    </th>
                    {vehicles.map((v) => (
                      <td key={v._id} className="border-l border-hair p-4 align-top text-fg-strong">
                        {row.render(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
