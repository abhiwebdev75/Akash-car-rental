/**
 * Booking conflict integration tests — the API-level guarantee behind §56:
 * the backend must never allow two overlapping bookings on the same vehicle,
 * and must refuse to book a vehicle that is out of service.
 *
 * This exercises the real HTTP → controller → booking service → availability
 * re-check → MongoDB write path (with the transaction falling back to a
 * session-less re-check on the single in-memory server).
 */
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, clearDB } = require('./helpers/testDb');
const { createLocation, createVehicle, daysFromNow } = require('./helpers/factories');
const { VEHICLE_STATUS, BOOKING_STATUS } = require('../../src/config/constants');

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDB);

/** Register a fresh customer and return { token }. */
async function registerCustomer(email = 'cust@example.com') {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Booking Customer',
    email,
    phone: '+919000012345',
    password: 'Passw0rd!',
  });
  expect(res.status).toBe(201);
  return { token: res.body.data.accessToken };
}

function bookingBody(vehicleId, locationId, fromDays, toDays) {
  return {
    vehicleId: String(vehicleId),
    locationId: String(locationId),
    pickupDate: daysFromNow(fromDays),
    returnDate: daysFromNow(toDays),
    pickupTime: '10:00',
    returnTime: '10:00',
  };
}

describe('POST /api/bookings — double-booking prevention', () => {
  it('creates a first booking, then REJECTS an overlapping one with 409', async () => {
    const { token } = await registerCustomer();
    const location = await createLocation();
    const vehicle = await createVehicle(location._id);
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);

    // First booking: days +2 → +5. Succeeds and holds the vehicle (PENDING).
    const first = await auth(request(app).post('/api/bookings')).send(
      bookingBody(vehicle._id, location._id, 2, 5)
    );
    expect(first.status).toBe(201);
    expect(first.body.data.status).toBe(BOOKING_STATUS.PENDING);
    expect(first.body.data.bookingNumber).toMatch(/^CR-\d{4}-\d{6}$/);

    // Overlapping request: days +3 → +4 (fully inside the first). Must be rejected.
    const overlap = await auth(request(app).post('/api/bookings')).send(
      bookingBody(vehicle._id, location._id, 3, 4)
    );
    expect(overlap.status).toBe(409);
    expect(overlap.body.success).toBe(false);
    expect(String(overlap.body.message)).toMatch(/not available/i);
  });

  it('ALLOWS a back-to-back booking that starts exactly when the previous ends (no buffer)', async () => {
    const { token } = await registerCustomer();
    const location = await createLocation();
    const vehicle = await createVehicle(location._id);
    const auth = (r) => r.set('Authorization', `Bearer ${token}`);

    const first = await auth(request(app).post('/api/bookings')).send(
      bookingBody(vehicle._id, location._id, 2, 5)
    );
    expect(first.status).toBe(201);

    // Starts on day +5 (the first one's return instant) → no overlap.
    const backToBack = await auth(request(app).post('/api/bookings')).send(
      bookingBody(vehicle._id, location._id, 5, 7)
    );
    expect(backToBack.status).toBe(201);
  });

  it('REJECTS booking a vehicle that is under maintenance with 409', async () => {
    const { token } = await registerCustomer();
    const location = await createLocation();
    const vehicle = await createVehicle(location._id, { status: VEHICLE_STATUS.MAINTENANCE });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(bookingBody(vehicle._id, location._id, 2, 5));

    expect(res.status).toBe(409);
    expect(String(res.body.message)).toMatch(/maintenance|not available/i);
  });

  it('REJECTS a booking whose vehicle does not belong to the chosen location with 400', async () => {
    const { token } = await registerCustomer();
    const locationA = await createLocation({ code: 'LOCA' });
    const locationB = await createLocation({ code: 'LOCB' });
    const vehicle = await createVehicle(locationA._id); // lives at A

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(bookingBody(vehicle._id, locationB._id, 2, 5)); // booked against B

    expect(res.status).toBe(400);
  });

  it('REJECTS a pickup date in the past with 400', async () => {
    const { token } = await registerCustomer();
    const location = await createLocation();
    const vehicle = await createVehicle(location._id);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(bookingBody(vehicle._id, location._id, -5, 2)); // starts 5 days ago

    expect(res.status).toBe(400);
  });
});
