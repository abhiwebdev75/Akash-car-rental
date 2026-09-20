/**
 * Test data factories + a login helper. Prerequisite entities (locations,
 * vehicles, staff accounts) are created directly through the models so tests
 * can focus on the behavior under test.
 */
const request = require('supertest');
const {
  ROLES,
  VEHICLE_TYPE,
  TRANSMISSION,
  FUEL_TYPE,
  VEHICLE_STATUS,
} = require('../../../src/config/constants');
const { User, Location, Vehicle } = require('../../../src/models');

let seq = 0;
const uniq = () => {
  seq += 1;
  return `${Date.now().toString(36)}${seq}`;
};

async function createLocation(overrides = {}) {
  return Location.create({
    name: 'Test HQ',
    code: `T${uniq()}`.slice(0, 10).toUpperCase(),
    address: '1 Test Street',
    city: 'Testville',
    ...overrides,
  });
}

async function createVehicle(locationId, overrides = {}) {
  return Vehicle.create({
    brand: 'Test',
    model: 'Car',
    registrationNumber: `TS${uniq()}`.toUpperCase(),
    vehicleType: VEHICLE_TYPE.SEDAN,
    transmission: TRANSMISSION.MANUAL,
    fuelType: FUEL_TYPE.PETROL,
    seats: 5,
    dailyPrice: 1000,
    securityDeposit: 2000,
    locationId,
    status: VEHICLE_STATUS.AVAILABLE,
    ...overrides,
  });
}

async function createUser({
  role = ROLES.CUSTOMER,
  email,
  password = 'Passw0rd!',
  name = 'Test User',
  phone,
  assignedLocation,
  emailVerified = true, // factory users are created directly (like admin/seed), so verified by default
} = {}) {
  const user = new User({
    name,
    email: email || `user_${uniq()}@example.com`,
    phone: phone || `+1999${String(seq).padStart(7, '0')}`,
    role,
    assignedLocation,
    emailVerifiedAt: emailVerified ? new Date() : null,
  });
  await user.setPassword(password);
  await user.save();
  return user;
}

/** Log in via the real API and return the access token. */
async function login(app, email, password = 'Passw0rd!') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
}

/** ISO date string N days from now (at 00:00 local — service applies pickupTime). */
function daysFromNow(n) {
  const d = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

module.exports = { createLocation, createVehicle, createUser, login, daysFromNow };
