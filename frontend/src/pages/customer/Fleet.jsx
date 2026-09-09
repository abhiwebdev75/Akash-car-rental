import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import VehicleCard from '../../components/customer/VehicleCard';
import { mockVehicles, mockLocations } from '../../api/mockData';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function Fleet() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search criteria from URL params
  const initialLocation = searchParams.get('locationId') || 'ALL';
  const initialType = searchParams.get('type') || 'ALL';
  const pickupDate = searchParams.get('pickupDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const pickupTime = searchParams.get('pickupTime') || '10:00';
  const returnTime = searchParams.get('returnTime') || '10:00';

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationId, setLocationId] = useState(initialLocation);
  const [vehicleType, setVehicleType] = useState(initialType);
  const [transmission, setTransmission] = useState('ALL');
  const [fuelType, setFuelType] = useState('ALL');
  const [seats, setSeats] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('recommended');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Compare cars state (up to 4 cars)
  const [comparedVehicles, setComparedVehicles] = useState([]);

  const handleToggleCompare = (vehicle) => {
    setComparedVehicles((prev) => {
      const exists = prev.some((v) => v._id === vehicle._id);
      if (exists) {
        return prev.filter((v) => v._id !== vehicle._id);
      } else {
        if (prev.length >= 4) {
          alert('You can compare up to 4 vehicles at a time.');
          return prev;
        }
        return [...prev, vehicle];
      }
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationId('ALL');
    setVehicleType('ALL');
    setTransmission('ALL');
    setFuelType('ALL');
    setSeats('ALL');
    setMaxPrice(10000);
    setSortBy('recommended');
  };

  // Filter and sort logic
  const filteredVehicles = useMemo(() => {
    return mockVehicles
      .filter((v) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match =
            v.make.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.type.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (locationId !== 'ALL' && v.locationId !== locationId) return false;
        if (vehicleType !== 'ALL' && v.type !== vehicleType) return false;
        if (transmission !== 'ALL' && v.transmission !== transmission) return false;
        if (fuelType !== 'ALL' && v.fuelType !== fuelType) return false;
        if (seats !== 'ALL' && v.seats !== parseInt(seats, 10)) return false;
        if (v.pricing?.daily > maxPrice) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.pricing.daily - b.pricing.daily;
        if (sortBy === 'price_desc') return b.pricing.daily - a.pricing.daily;
        if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
        return 0; // recommended default
      });
  }, [searchQuery, locationId, vehicleType, transmission, fuelType, seats, maxPrice, sortBy]);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Search Bar */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Our Vehicle Fleet
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose from premium Hatchbacks, Sedans, SUVs, and Luxury vehicles.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by make or model (e.g. Swift, City, Creta, BMW...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm cursor-pointer"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>

              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden flex items-center gap-2 h-12 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filter Panel */}
          <aside
            className={`lg:block ${
              showMobileFilters ? 'block' : 'hidden'
            } bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 h-fit sticky top-28`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Filters
                </h3>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Locations</option>
                {mockLocations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Body Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['ALL', 'HATCHBACK', 'SEDAN', 'SUV', 'MUV', 'LUXURY'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVehicleType(t)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-colors ${
                      vehicleType === t
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'ALL' ? 'All' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Transmission */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Transmission
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['ALL', 'MANUAL', 'AUTOMATIC'].map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => setTransmission(tr)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-colors ${
                      transmission === tr
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tr === 'ALL' ? 'Any' : tr === 'AUTOMATIC' ? 'Auto' : 'Manual'}
                  </button>
                ))}
              </div>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Fuel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['ALL', 'PETROL', 'DIESEL', 'ELECTRIC'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFuelType(f)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-colors ${
                      fuelType === f
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f === 'ALL' ? 'Any Fuel' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Seating */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Seats
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['ALL', '5', '7'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeats(s)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-colors ${
                      seats === s
                        ? 'bg-brand-50 border-brand-500 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s === 'ALL' ? 'Any' : `${s} Seats`}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Daily Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Max Daily Rate
                </label>
                <span className="text-xs font-extrabold text-brand-600">
                  {formatCurrency(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="10000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>
          </aside>

          {/* Cars Grid Area */}
          <main className="lg:col-span-3">
            {filteredVehicles.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No cars found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Try broadening your search query or reset filters to see all available cars.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle._id}
                    vehicle={vehicle}
                    searchParams={{
                      locationId: locationId !== 'ALL' ? locationId : vehicle.locationId,
                      pickupDate,
                      returnDate,
                      pickupTime,
                      returnTime,
                    }}
                    onCompare={handleToggleCompare}
                    isCompared={comparedVehicles.some((v) => v._id === vehicle._id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Floating Compare Drawer if cars are selected */}
        {comparedVehicles.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-slate-700 flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-200 max-w-2xl w-full mx-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-400" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Compare Fleet</p>
                <p className="text-xs text-slate-400">
                  {comparedVehicles.length} of 4 cars selected
                </p>
              </div>
            </div>

            <div className="flex -space-x-2 overflow-hidden">
              {comparedVehicles.map((v) => (
                <img
                  key={v._id}
                  src={v.images[0]}
                  alt={v.model}
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-slate-800 object-cover"
                />
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setComparedVehicles([])}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
              <Link
                to={`/compare?ids=${comparedVehicles.map((v) => v._id).join(',')}`}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Compare Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

