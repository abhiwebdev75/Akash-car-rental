/**
 * Database seed script — populates a fresh database with realistic, entirely
 * fictional data for development and demos:
 *   • business settings, 2 locations
 *   • one user per staff role + several customers
 *   • a 12-vehicle fleet spread across both locations
 *   • add-ons and coupons
 *   • bookings in every lifecycle state (completed / active / confirmed /
 *     pending / cancelled) — carefully NON-OVERLAPPING per vehicle so they
 *     respect the availability rules the API enforces
 *   • payments, maintenance history, and reviews
 *
 * Usage:
 *   npm run seed            # wipe + reseed
 *   npm run seed:destroy    # wipe only
 *
 * All data here is invented for demonstration; there is no real business data.
 */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const { config } = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const models = require('../src/models');
const pricing = require('../src/services/pricing.service');
const bookingNumberService = require('../src/services/bookingNumber.service');
const C = require('../src/config/constants');

const {
  User, Location, Vehicle, AddOn, Booking, Payment, Maintenance,
  Coupon, Review, Notification, Counter, Settings,
} = models;

const { round2 } = pricing;

// ── Small date helpers (UTC, 10:00 pickup convention) ───────────────────────
const DAY = 24 * 60 * 60 * 1000;
function atDays(offsetDays, hour = 10) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0, 0));
  return new Date(d.getTime() + offsetDays * DAY);
}

async function wipe() {
  const all = [
    User, Location, Vehicle, AddOn, Booking, Payment, Maintenance,
    Coupon, Review, Notification, Counter, Settings,
    models.VehicleInspection, models.Damage, models.Document,
    models.RentalAgreement, models.VehicleTransfer, models.EmergencyRequest,
  ];
  await Promise.all(all.map((M) => M.deleteMany({})));
  console.log('  ✓ cleared all collections');
}

async function makeUser({ name, email, phone, role, assignedLocation, password }) {
  const u = new User({ name, email, phone, role, assignedLocation });
  await u.setPassword(password);
  await u.save();
  return u;
}

/** Create a fully-priced booking (+ optional payment) in a given state. */
async function makeBooking({
  customer, vehicle, location, startAt, endAt, status,
  addOns = [], coupon = null, pay = 'none', createdBy,
}) {
  const q = pricing.quote({
    vehicle,
    startAt,
    endAt,
    addOns,
    coupon,
    taxRate: SETTINGS.taxRate,
  });
  const bookingNumber = await bookingNumberService.nextBookingNumber(startAt);

  let amountPaid = 0;
  let paymentStatus = C.PAYMENT_STATUS.PENDING;
  if (pay === 'full') { amountPaid = q.total; paymentStatus = C.PAYMENT_STATUS.PAID; }
  else if (pay === 'partial') { amountPaid = round2(q.total * 0.3); paymentStatus = C.PAYMENT_STATUS.PARTIAL; }

  const booking = await Booking.create({
    bookingNumber,
    customerId: customer._id,
    vehicleId: vehicle._id,
    locationId: location._id,
    pickupDate: startAt,
    returnDate: endAt,
    pickupTime: '10:00',
    returnTime: '10:00',
    startAt,
    endAt,
    status,
    addOns: q.addOns,
    couponId: coupon ? coupon._id : undefined,
    pricingBreakdown: {
      days: q.days,
      baseStrategy: q.baseStrategy,
      base: q.base,
      addOnsTotal: q.addOnsTotal,
      subtotal: q.subtotal,
    },
    discount: q.discount,
    tax: q.tax,
    taxRate: q.taxRate,
    securityDeposit: q.securityDeposit,
    totalAmount: q.total,
    amountPaid,
    paymentStatus,
    createdBy: (createdBy || customer)._id,
    ...(status === C.BOOKING_STATUS.CANCELLED
      ? { cancellation: { at: atDays(-1), by: customer._id, reason: 'Plans changed', refundAmount: 0 } }
      : {}),
  });

  if (amountPaid > 0) {
    await Payment.create({
      bookingId: booking._id,
      customerId: customer._id,
      kind: C.PAYMENT_KIND.RENTAL,
      amount: amountPaid,
      method: C.PAYMENT_METHOD.UPI,
      status: C.PAYMENT_STATUS.PAID,
      paidAt: startAt,
      recordedBy: (createdBy || customer)._id,
      notes: 'Seed payment',
    });
  }

  return booking;
}

let SETTINGS; // set during seed()

async function seed() {
  console.log('Seeding database...');
  await wipe();

  // ── Settings ───────────────────────────────────────────────────────────────
  SETTINGS = await Settings.getSettings();
  SETTINGS.businessName = 'DriveEasy Car Rentals';
  SETTINGS.phone = '+91 98200 10000';
  SETTINGS.email = 'hello@driveeasy.example';
  SETTINGS.whatsapp = '+91 98200 10000';
  SETTINGS.address = 'Near Neelam Cinema, Sector 17C, Chandigarh (UT) 160017';
  SETTINGS.currency = 'INR';
  SETTINGS.taxRate = 0.18;
  SETTINGS.policies.terms = 'Renter must hold a valid driving licence held for at least 1 year.';
  SETTINGS.policies.cancellation = 'Free cancellation up to 24 hours before pickup.';
  SETTINGS.booking.minRentalHours = 4;
  SETTINGS.booking.cancellationWindowHours = 24;
  await SETTINGS.save();
  console.log('  ✓ settings');

  // ── Locations ────────────────────────────────────────────────────────────────
  const [chd, khr] = await Location.create([
    {
      name: 'Chandigarh — Sector 17 City Hub',
      code: 'IXC',
      address: 'Near Neelam Cinema, Sector 17C',
      city: 'Chandigarh',
      state: 'Chandigarh (UT)',
      pincode: '160017',
      phone: '+91 98765 10001',
      geo: { lat: 30.7333, lng: 76.7794 },
    },
    {
      name: 'Kharar — Chandigarh University Hub',
      code: 'KHR',
      address: 'NH-05 Ludhiana-Chandigarh Highway (Near CU Gate)',
      city: 'Kharar',
      state: 'Punjab',
      pincode: '140413',
      phone: '+91 98765 10002',
      geo: { lat: 30.7499, lng: 76.6411 },
    },
  ]);
  console.log('  ✓ 2 locations (Chandigarh & Kharar - CU Hub)');

  // ── Staff & customers ────────────────────────────────────────────────────────
  const owner = await makeUser({
    name: config.owner.name || 'Aarav Mehta',
    email: config.owner.email,
    phone: '+91 90000 00001',
    role: C.ROLES.OWNER,
    password: config.owner.password,
  });
  const managerChd = await makeUser({
    name: 'Priya Nair', email: 'priya.manager@driveeasy.example', phone: '+91 90000 00002',
    role: C.ROLES.MANAGER, assignedLocation: chd._id, password: 'Manager@12345',
  });
  const managerKhr = await makeUser({
    name: 'Rohan Gupta', email: 'rohan.manager@driveeasy.example', phone: '+91 90000 00003',
    role: C.ROLES.MANAGER, assignedLocation: khr._id, password: 'Manager@12345',
  });
  const staffChd = await makeUser({
    name: 'Sana Khan', email: 'sana.staff@driveeasy.example', phone: '+91 90000 00004',
    role: C.ROLES.STAFF, assignedLocation: chd._id, password: 'Staff@12345',
  });
  const accountant = await makeUser({
    name: 'Vikram Rao', email: 'vikram.accounts@driveeasy.example', phone: '+91 90000 00005',
    role: C.ROLES.ACCOUNTANT, password: 'Accounts@12345',
  });

  chd.manager = managerChd._id;
  khr.manager = managerKhr._id;
  await chd.save();
  await khr.save();

  const customers = await Promise.all(
    [
      ['Neha Sharma', 'neha@example.com', '+91 90000 10001'],
      ['Arjun Patel', 'arjun@example.com', '+91 90000 10002'],
      ['Fatima Sheikh', 'fatima@example.com', '+91 90000 10003'],
      ['Karthik Iyer', 'karthik@example.com', '+91 90000 10004'],
      ['Meera Menon', 'meera@example.com', '+91 90000 10005'],
      ['Dev Malhotra', 'dev@example.com', '+91 90000 10006'],
    ].map(([name, email, phone]) =>
      makeUser({ name, email, phone, role: C.ROLES.CUSTOMER, password: 'Customer@12345' })
    )
  );
  console.log(`  ✓ ${5 + customers.length} users (owner, managers, staff, accountant, ${customers.length} customers)`);

  // ── Add-ons ──────────────────────────────────────────────────────────────────
  const [childSeat, gps, addlDriver, roadside, fuelPrepay] = await AddOn.create([
    { name: 'Child Seat', description: 'Rear-facing / booster seat', price: 150, pricingType: C.ADDON_PRICING_TYPE.PER_DAY, maxQuantity: 2 },
    { name: 'GPS Navigation', description: 'Dedicated GPS device', price: 300, pricingType: C.ADDON_PRICING_TYPE.PER_RENTAL },
    { name: 'Additional Driver', description: 'Add a second authorised driver', price: 500, pricingType: C.ADDON_PRICING_TYPE.PER_RENTAL },
    { name: 'Roadside Assistance+', description: '24x7 premium roadside cover', price: 400, pricingType: C.ADDON_PRICING_TYPE.PER_RENTAL },
    { name: 'Fuel Prepay', description: 'Prepaid full tank, no need to refuel', price: 1000, pricingType: C.ADDON_PRICING_TYPE.PER_RENTAL },
  ]);
  console.log('  ✓ 5 add-ons');

  // ── Coupons ──────────────────────────────────────────────────────────────────
  const [cu10] = await Coupon.create([
    { code: 'CU10', type: C.COUPON_TYPE.PERCENTAGE, value: 10, maximumDiscount: 1500, minimumRental: 1500, startDate: atDays(-30), endDate: atDays(90), active: true },
  ]);
  console.log('  ✓ 1 coupon (CU10 — 10% for Chandigarh University students)');

  // ── Fleet ────────────────────────────────────────────────────────────────────
  const V = C.VEHICLE_TYPE;
  const T = C.TRANSMISSION;
  const F = C.FUEL_TYPE;
  const fleetSpec = [
    ['Maruti Suzuki', 'Swift', 'VXI', 2023, 'CH01AB1234', V.HATCHBACK, T.MANUAL, F.PETROL, 5, 2, 1800, 11000, 42000, 5000, chd],
    ['Hyundai', 'i20', 'Asta', 2023, 'CH01AB2345', V.HATCHBACK, T.MANUAL, F.PETROL, 5, 2, 2000, 12500, 46000, 5000, chd],
    ['Honda', 'City', 'ZX', 2024, 'CH01CD3456', V.SEDAN, T.AUTOMATIC, F.PETROL, 5, 3, 3200, 20000, 74000, 8000, chd],
    ['Hyundai', 'Verna', 'SX', 2023, 'CH01CD4567', V.SEDAN, T.AUTOMATIC, F.DIESEL, 5, 3, 3400, 21000, 78000, 8000, chd],
    ['Toyota', 'Innova Crysta', 'GX', 2023, 'CH01EF5678', V.MUV, T.MANUAL, F.DIESEL, 7, 4, 4800, 30000, 110000, 10000, chd],
    ['Mahindra', 'Thar', 'LX 4x4', 2023, 'PB65EF6789', V.SUV, T.AUTOMATIC, F.DIESEL, 4, 2, 4200, 26000, 96000, 10000, khr],
    ['Tata', 'Nexon EV', 'Max', 2024, 'PB65GH1234', V.SUV, T.AUTOMATIC, F.ELECTRIC, 5, 3, 3200, 20000, 72000, 8000, khr],
    ['Maruti Suzuki', 'Baleno', 'Zeta', 2023, 'PB65GH2345', V.HATCHBACK, T.MANUAL, F.PETROL, 5, 2, 1900, 11800, 44000, 5000, khr],
    ['Hyundai', 'Creta', 'SX (O)', 2023, 'PB65IJ3456', V.SUV, T.AUTOMATIC, F.DIESEL, 5, 3, 3800, 24000, 88000, 8000, khr],
    ['Mahindra', 'Scorpio-N', 'Z8L', 2024, 'PB65IJ4567', V.SUV, T.MANUAL, F.DIESEL, 7, 4, 4500, 28000, 105000, 10000, khr],
    ['Maruti Suzuki', 'Ertiga', 'ZXI', 2023, 'PB65KL5678', V.MUV, T.MANUAL, F.CNG, 7, 3, 2600, 16000, 60000, 7000, khr],
    ['BMW', '3 Series', '330Li', 2024, 'CH01KL6789', V.LUXURY, T.AUTOMATIC, F.PETROL, 5, 3, 9500, 60000, 220000, 25000, chd],
  ];

  const vehicles = await Vehicle.create(
    fleetSpec.map(([brand, model, variant, year, reg, vehicleType, transmission, fuelType, seats, luggage, daily, weekly, monthly, deposit, loc]) => ({
      brand, model, variant, year,
      registrationNumber: reg,
      vehicleType, transmission, fuelType,
      seats, luggageCapacity: luggage,
      description: `${brand} ${model} ${variant} — well-maintained ${vehicleType.toLowerCase()} available at ${loc.city}.`,
      features: ['Air Conditioning', 'Power Steering', 'Airbags', 'Bluetooth Audio', 'ABS'],
      locationId: loc._id,
      status: C.VEHICLE_STATUS.AVAILABLE,
      dailyPrice: daily, weeklyPrice: weekly, monthlyPrice: monthly,
      securityDeposit: deposit,
      extraKmPrice: 12,
      kmPerDayAllowance: 250,
      currentMileage: 15000 + Math.floor(Math.random() * 40000),
      nextServiceMileage: 60000,
      lastServiceDate: atDays(-90),
      insuranceExpiry: atDays(200),
      pucExpiry: atDays(120),
    }))
  );
  console.log(`  ✓ ${vehicles.length} vehicles`);

  const byReg = (reg) => vehicles.find((v) => v.registrationNumber === reg);

  // ── Bookings (non-overlapping per vehicle) ─────────────────────────────────
  const swift = byReg('KA01AB1234');
  const city = byReg('KA01CD3456');
  const innova = byReg('KA01EF5678');
  const nexon = byReg('KA09GH1234');
  const seltos = byReg('KA09IJ3456');
  const ertiga = byReg('KA09KL5678');
  const fortuner = byReg('KA09IJ4567');

  const completed1 = await makeBooking({
    customer: customers[0], vehicle: swift, location: blr,
    startAt: atDays(-20), endAt: atDays(-17), status: C.BOOKING_STATUS.COMPLETED,
    addOns: [{ addOnId: gps._id, name: gps.name, pricingType: gps.pricingType, unitPrice: gps.price, quantity: 1 }],
    pay: 'full', createdBy: staffBlr,
  });
  const completed2 = await makeBooking({
    customer: customers[1], vehicle: city, location: blr,
    startAt: atDays(-15), endAt: atDays(-11), status: C.BOOKING_STATUS.COMPLETED,
    coupon: weekend10, pay: 'full', createdBy: staffBlr,
  });
  const completed3 = await makeBooking({
    customer: customers[2], vehicle: nexon, location: mys,
    startAt: atDays(-30), endAt: atDays(-26), status: C.BOOKING_STATUS.COMPLETED,
    addOns: [{ addOnId: childSeat._id, name: childSeat.name, pricingType: childSeat.pricingType, unitPrice: childSeat.price, quantity: 1 }],
    pay: 'full', createdBy: managerMys,
  });

  // Active now — vehicle is out on rental.
  const active1 = await makeBooking({
    customer: customers[3], vehicle: innova, location: blr,
    startAt: atDays(-1), endAt: atDays(2), status: C.BOOKING_STATUS.ACTIVE,
    addOns: [{ addOnId: addlDriver._id, name: addlDriver.name, pricingType: addlDriver.pricingType, unitPrice: addlDriver.price, quantity: 1 }],
    pay: 'partial', createdBy: staffBlr,
  });
  innova.status = C.VEHICLE_STATUS.RENTED;
  await innova.save();

  // Future confirmed (same Swift, well after its completed rental).
  await makeBooking({
    customer: customers[0], vehicle: swift, location: blr,
    startAt: atDays(6), endAt: atDays(9), status: C.BOOKING_STATUS.CONFIRMED,
    coupon: weekend10, pay: 'partial', createdBy: customers[0],
  });
  // Future pending.
  await makeBooking({
    customer: customers[4], vehicle: seltos, location: mys,
    startAt: atDays(10), endAt: atDays(13), status: C.BOOKING_STATUS.PENDING,
    pay: 'none', createdBy: customers[4],
  });
  // Cancelled.
  await makeBooking({
    customer: customers[5], vehicle: ertiga, location: mys,
    startAt: atDays(4), endAt: atDays(6), status: C.BOOKING_STATUS.CANCELLED,
    pay: 'none', createdBy: customers[5],
  });
  console.log('  ✓ 7 bookings (3 completed, 1 active, 1 confirmed, 1 pending, 1 cancelled)');

  // Update loyalty for completed rentals.
  await User.updateOne({ _id: customers[0]._id }, { $inc: { 'loyalty.completedRentals': 1, 'loyalty.points': 120, 'loyalty.totalSpend': completed1.totalAmount } });
  await User.updateOne({ _id: customers[1]._id }, { $inc: { 'loyalty.completedRentals': 1, 'loyalty.points': 150, 'loyalty.totalSpend': completed2.totalAmount } });
  await User.updateOne({ _id: customers[2]._id }, { $inc: { 'loyalty.completedRentals': 1, 'loyalty.points': 140, 'loyalty.totalSpend': completed3.totalAmount } });

  // ── Reviews (only for completed bookings) ──────────────────────────────────
  await Review.create([
    { customerId: customers[0]._id, vehicleId: swift._id, bookingId: completed1._id, rating: 5, review: 'Spotless car and super smooth pickup. Will rent again!', status: C.REVIEW_STATUS.VISIBLE, featured: true },
    { customerId: customers[1]._id, vehicleId: city._id, bookingId: completed2._id, rating: 4, review: 'Comfortable ride, though pickup took a little while.', status: C.REVIEW_STATUS.VISIBLE },
    { customerId: customers[2]._id, vehicleId: nexon._id, bookingId: completed3._id, rating: 5, review: 'Loved the EV — quiet and cheap to run. Highly recommend.', status: C.REVIEW_STATUS.VISIBLE, featured: true },
  ]);
  console.log('  ✓ 3 reviews');

  // ── Maintenance ────────────────────────────────────────────────────────────
  // A completed past service (does not block availability).
  await Maintenance.create({
    vehicleId: city._id, type: C.MAINTENANCE_TYPE.SERVICE, description: 'Scheduled 40k service',
    status: C.MAINTENANCE_STATUS.COMPLETED, scheduledStart: atDays(-60), scheduledEnd: atDays(-59),
    completedAt: atDays(-59), cost: 6500, odometerAtService: 42000, vendor: 'Honda Service Centre',
    performedBy: managerBlr._id,
  });
  // An in-progress maintenance — take the luxury BMW off the road.
  const bmw = byReg('KA09KL6789');
  await Maintenance.create({
    vehicleId: bmw._id, type: C.MAINTENANCE_TYPE.BRAKE_SERVICE, description: 'Brake pads + rotor inspection',
    status: C.MAINTENANCE_STATUS.IN_PROGRESS, scheduledStart: atDays(-1), scheduledEnd: atDays(1),
    vendor: 'BMW Authorised', performedBy: managerMys._id,
  });
  bmw.status = C.VEHICLE_STATUS.MAINTENANCE;
  await bmw.save();
  // A future scheduled service for the Fortuner (no bookings on it).
  await Maintenance.create({
    vehicleId: fortuner._id, type: C.MAINTENANCE_TYPE.OIL_CHANGE, description: 'Routine oil change',
    status: C.MAINTENANCE_STATUS.SCHEDULED, scheduledStart: atDays(3), scheduledEnd: atDays(4),
    vendor: 'Toyota Service', performedBy: managerMys._id,
  });
  console.log('  ✓ 3 maintenance records (1 in-progress → BMW is MAINTENANCE, 1 scheduled, 1 completed)');

  // Mark one vehicle inactive (retired from the bookable fleet).
  const baleno = byReg('KA09GH2345');
  baleno.status = C.VEHICLE_STATUS.INACTIVE;
  await baleno.save();

  // ── A couple of notifications for the owner's inbox ────────────────────────
  await Notification.create([
    { userId: owner._id, audience: C.NOTIFICATION_AUDIENCE.ADMIN, type: C.NOTIFICATION_TYPE.NEW_BOOKING, title: `New booking ${active1.bookingNumber}`, body: 'A new booking is awaiting review.', channels: [C.NOTIFICATION_CHANNEL.IN_APP] },
    { userId: owner._id, audience: C.NOTIFICATION_AUDIENCE.ADMIN, type: C.NOTIFICATION_TYPE.MAINTENANCE_DUE, title: 'Maintenance scheduled', body: 'Fortuner (KA09IJ4567) oil change scheduled.', channels: [C.NOTIFICATION_CHANNEL.IN_APP] },
  ]);
  console.log('  ✓ notifications');

  console.log('\nSeed complete. Sign-in credentials (all fictional):');
  console.table([
    { role: 'OWNER', email: owner.email, password: config.owner.password },
    { role: 'MANAGER (BLR)', email: managerBlr.email, password: 'Manager@12345' },
    { role: 'MANAGER (MYS)', email: managerMys.email, password: 'Manager@12345' },
    { role: 'STAFF (BLR)', email: staffBlr.email, password: 'Staff@12345' },
    { role: 'ACCOUNTANT', email: accountant.email, password: 'Accounts@12345' },
    { role: 'CUSTOMER', email: customers[0].email, password: 'Customer@12345' },
  ]);
}

async function main() {
  const destroyOnly = process.argv.includes('--destroy');
  try {
    await connectDB();
    if (destroyOnly) {
      console.log('Destroying all data...');
      await wipe();
      console.log('Done.');
    } else {
      await seed();
    }
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    await mongoose.connection.close().catch(() => {});
  }
}

main();
