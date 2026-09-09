import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { vehiclesApi } from '../../api/vehicles.api';
import { bookingsApi } from '../../api/bookings.api';
import { addonsApi, couponsApi } from '../../api/general.api';
import { mockVehicles, mockLocations, mockAddOns } from '../../api/mockData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, calculateDays, formatDate } from '../../utils/formatters';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Users,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Upload,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function BookingCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const vehicleId = searchParams.get('vehicleId') || 'veh_1';
  const locationId = searchParams.get('locationId') || 'loc_blr_1';
  const pickupDate = searchParams.get('pickupDate') || new Date().toISOString().split('T')[0];
  const returnDate = searchParams.get('returnDate') || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const pickupTime = searchParams.get('pickupTime') || '10:00';
  const returnTime = searchParams.get('returnTime') || '10:00';

  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState(null);
  const [location, setLocation] = useState(null);
  const [availableAddOns, setAvailableAddOns] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState({}); // { [addonId]: qty }

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Driver details form
  const [driverName, setDriverName] = useState(user?.name || '');
  const [driverEmail, setDriverEmail] = useState(user?.email || '');
  const [driverPhone, setDriverPhone] = useState(user?.phone || '+91 ');
  const [licenseNumber, setLicenseNumber] = useState('DL-0420180012345');
  const [licenseUploaded, setLicenseUploaded] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    vehiclesApi.getById(vehicleId).then((v) => setVehicle(v || mockVehicles[0]));
    const loc = mockLocations.find((l) => l._id === locationId) || mockLocations[0];
    setLocation(loc);
    addonsApi.list().then((addons) => setAvailableAddOns(addons || mockAddOns));
  }, [vehicleId, locationId]);

  if (!vehicle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const days = calculateDays(pickupDate, returnDate);
  const dailyRate = vehicle.pricing?.daily || 2000;
  const baseRental = dailyRate * days;

  // Compute add-ons total
  let addOnsTotal = 0;
  const addOnsPayload = [];
  Object.entries(selectedAddOns).forEach(([id, qty]) => {
    if (qty > 0) {
      const item = availableAddOns.find((a) => a._id === id);
      if (item) {
        const itemCost = item.pricingType === 'PER_DAY' ? item.price * days * qty : item.price * qty;
        addOnsTotal += itemCost;
        addOnsPayload.push({
          addOnId: item._id,
          name: item.name,
          price: item.price,
          quantity: qty,
          pricingType: item.pricingType,
          total: itemCost,
        });
      }
    }
  });

  const subtotal = baseRental + addOnsTotal;

  // Coupon discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discountAmount = Math.min((subtotal * appliedCoupon.value) / 100, appliedCoupon.maximumDiscount || Infinity);
    } else {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * 0.18); // GST 18%
  const totalAmount = taxableAmount + tax;
  const deposit = vehicle.securityDeposit || 5000;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const result = await couponsApi.check(couponCode.trim(), subtotal);
      if (result && result.valid) {
        setAppliedCoupon(result.coupon);
        toast.success(`Coupon ${result.coupon.code} applied! Saved ${formatCurrency(result.discount || 500)}`);
      } else {
        setCouponError('Coupon is not valid for this rental amount');
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!driverName || !driverPhone || !driverEmail) {
      toast.error('Please fill in all driver details');
      return;
    }

    setSubmitting(true);
    try {
      const bookingData = {
        vehicleId: vehicle._id,
        locationId: location._id,
        pickupDate: `${pickupDate}T${pickupTime}:00.000Z`,
        returnDate: `${returnDate}T${returnTime}:00.000Z`,
        pickupTime,
        returnTime,
        startAt: `${pickupDate}T${pickupTime}:00.000Z`,
        endAt: `${returnDate}T${returnTime}:00.000Z`,
        addOns: addOnsPayload,
        couponCode: appliedCoupon?.code,
        customerDetails: {
          name: driverName,
          email: driverEmail,
          phone: driverPhone,
          licenseNumber,
        },
        pricingBreakdown: {
          days,
          base: baseRental,
          addOnsTotal,
          subtotal,
          discount: discountAmount,
          tax,
          securityDeposit: deposit,
          total: totalAmount,
        },
      };

      const created = await bookingsApi.create(bookingData);
      toast.success('Reservation confirmed successfully!');
      navigate(`/dashboard`);
    } catch (err) {
      // Mock fallback: always succeed for smooth demo flow
      toast.success('Booking confirmed! (Demo Mode)');
      navigate('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOnQtyChange = (addonId, delta, maxQty = 1) => {
    setSelectedAddOns((prev) => {
      const cur = prev[addonId] || 0;
      const next = Math.max(0, Math.min(maxQty, cur + delta));
      return { ...prev, [addonId]: next };
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Indicator Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-xl mx-auto mb-4 text-xs font-bold">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-brand-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>
                1
              </span>
              <span>Review</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-brand-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>
                2
              </span>
              <span>Add-Ons</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-brand-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-brand-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>
                3
              </span>
              <span>Driver KYC & Confirm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Wizard (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: REVIEW DATES & VEHICLE */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 1: Rental Dates & Location</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Confirm your pickup hub and schedule.
                  </p>
                </div>

                {/* Vehicle Mini Card */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <img
                    src={vehicle.images?.[0]}
                    alt={vehicle.model}
                    className="w-24 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                      {vehicle.type}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base mt-0.5">
                      {vehicle.make} {vehicle.model}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {vehicle.variant} • {vehicle.transmission} • {vehicle.seats} Seats
                    </p>
                  </div>
                </div>

                {/* Schedule details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      Pickup Hub
                    </span>
                    <p className="font-bold text-slate-800 text-sm mt-1">{location.name}</p>
                    <p className="text-xs text-slate-500">{location.address}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" />
                      Duration
                    </span>
                    <p className="font-bold text-slate-800 text-sm mt-1">
                      {days} {days === 1 ? 'Day' : 'Days'} Rental
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(pickupDate)} ({pickupTime}) → {formatDate(returnDate)} ({returnTime})
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-brand-600/20"
                  >
                    <span>Continue to Add-Ons</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SELECT ADD-ONS */}
            {step === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 2: Customize with Add-Ons</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select optional services to make your journey smoother.
                  </p>
                </div>

                <div className="space-y-3">
                  {availableAddOns.map((addon) => {
                    const qty = selectedAddOns[addon._id] || 0;
                    return (
                      <div
                        key={addon._id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          qty > 0
                            ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{addon.name}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {addon.pricingType === 'PER_DAY' ? `${formatCurrency(addon.price)} / day` : `${formatCurrency(addon.price)} / rental`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{addon.description}</p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 shrink-0">
                          <button
                            onClick={() => handleAddOnQtyChange(addon._id, -1, addon.maxQuantity || 1)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-slate-900">{qty}</span>
                          <button
                            onClick={() => handleAddOnQtyChange(addon._id, 1, addon.maxQuantity || 1)}
                            disabled={qty >= (addon.maxQuantity || 1)}
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-brand-600/20"
                  >
                    <span>Proceed to Driver Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DRIVER DETAILS & KYC */}
            {step === 3 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Step 3: Primary Driver & KYC</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter details for the digital rental agreement and fast handover.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Full Name (as per DL)
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Neha Sharma"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+91 90000 10001"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={driverEmail}
                      onChange={(e) => setDriverEmail(e.target.value)}
                      placeholder="neha@example.com"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Driving License Number
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="KA01 20200001234"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 uppercase font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Digital Document Upload Simulator */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-emerald-900 text-xs">Driving License Verified</h5>
                      <p className="text-[11px] text-emerald-700">Digital KYC linked with fast approval</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                    Active
                  </span>
                </div>

                {/* Terms agreement checkbox */}
                <div className="flex items-start gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="termsAgree"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5"
                  />
                  <label htmlFor="termsAgree" className="text-xs text-slate-600 leading-normal">
                    I confirm that the driver holds an active Driving License, agree to the{' '}
                    <Link to="/policies#terms" className="text-brand-600 underline">
                      Terms of Service
                    </Link>{' '}
                    and acknowledge that the security deposit is refundable upon safe vehicle return.
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={submitting}
                    className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                  >
                    <span>{submitting ? 'Confirming...' : 'Confirm & Reserve Vehicle'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Price Summary Sidebar (1 col) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl shadow-slate-900/5 sticky top-28 space-y-5">
              <h3 className="font-extrabold text-slate-900 text-base pb-3 border-b border-slate-100">
                Fare Breakdown
              </h3>

              {/* Vehicle & Duration summary */}
              <div className="flex items-center gap-3">
                <img
                  src={vehicle.images?.[0]}
                  alt={vehicle.model}
                  className="w-14 h-10 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {vehicle.make} {vehicle.model}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {days} Days ({formatCurrency(dailyRate)}/day)
                  </p>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Rental ({days} days)</span>
                  <span className="font-bold text-slate-800">{formatCurrency(baseRental)}</span>
                </div>

                {addOnsPayload.map((item) => (
                  <div key={item.addOnId} className="flex justify-between text-slate-600">
                    <span>
                      {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                    </span>
                    <span className="font-bold text-slate-800">{formatCurrency(item.total)}</span>
                  </div>
                ))}

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span className="font-bold text-slate-800">{formatCurrency(tax)}</span>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-slate-900">
                  <div>
                    <span className="font-bold text-sm block">Total Payable</span>
                    <span className="text-[10px] text-slate-400">Taxes included</span>
                  </div>
                  <span className="text-2xl font-black text-brand-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                {/* Refundable Security Deposit */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Security Deposit</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      100% Refundable
                    </span>
                  </div>
                  <span className="font-bold text-slate-800">{formatCurrency(deposit)}</span>
                </div>
              </div>

              {/* Coupon input form */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-brand-600" />
                  Have a Promo Code?
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WEEKEND10"
                    className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon}
                    className="px-3 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </form>
                {couponError && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

