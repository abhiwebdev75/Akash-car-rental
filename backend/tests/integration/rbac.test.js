/**
 * RBAC integration tests — authorization is enforced on the backend, per role,
 * regardless of what any client sends. These assert the *authorization* outcome
 * only (401 unauthenticated, 403 wrong role, and "not blocked" for permitted
 * roles) so unrelated controller/business logic can't cause false failures.
 *
 * Route guards under test:
 *   GET  /api/bookings             → authenticate (any signed-in role)
 *   GET  /api/reports/revenue      → requireFinance  (OWNER/MANAGER/ACCOUNTANT)
 *   GET  /api/users                → requireManagerUp (OWNER/MANAGER)
 *   POST /api/bookings/:id/confirm → requireStaffUp   (OWNER/MANAGER/STAFF)
 */
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, clearDB } = require('./helpers/testDb');
const { createUser, login } = require('./helpers/factories');
const { ROLES } = require('../../src/config/constants');

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDB);

/** Create a user of the given role and return a valid Bearer token. */
async function tokenFor(role) {
  const email = `${role.toLowerCase()}_${Date.now()}@example.com`;
  await createUser({ role, email, password: 'Passw0rd!' });
  return login(app, email, 'Passw0rd!');
}

const bearer = (t) => ({ Authorization: `Bearer ${t}` });

describe('Authentication gate', () => {
  it('rejects unauthenticated access to a protected list route (401)', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated access to reports (401)', async () => {
    const res = await request(app).get('/api/reports/revenue');
    expect(res.status).toBe(401);
  });
});

describe('requireFinance — GET /api/reports/revenue', () => {
  it('forbids a CUSTOMER (403)', async () => {
    const token = await tokenFor(ROLES.CUSTOMER);
    const res = await request(app).get('/api/reports/revenue').set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('forbids a STAFF member (403) — staff is not a finance role', async () => {
    const token = await tokenFor(ROLES.STAFF);
    const res = await request(app).get('/api/reports/revenue').set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('permits an ACCOUNTANT (not blocked by authorization)', async () => {
    const token = await tokenFor(ROLES.ACCOUNTANT);
    const res = await request(app).get('/api/reports/revenue').set(bearer(token));
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe('requireManagerUp — GET /api/users', () => {
  it('forbids a CUSTOMER (403)', async () => {
    const token = await tokenFor(ROLES.CUSTOMER);
    const res = await request(app).get('/api/users').set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('forbids a STAFF member (403) — staff is below manager', async () => {
    const token = await tokenFor(ROLES.STAFF);
    const res = await request(app).get('/api/users').set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('forbids an ACCOUNTANT (403) — finance is not user-management', async () => {
    const token = await tokenFor(ROLES.ACCOUNTANT);
    const res = await request(app).get('/api/users').set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('permits a MANAGER (not blocked by authorization)', async () => {
    const token = await tokenFor(ROLES.MANAGER);
    const res = await request(app).get('/api/users').set(bearer(token));
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe('requireStaffUp — POST /api/bookings/:id/confirm', () => {
  const fakeId = new mongoose.Types.ObjectId().toString();

  it('forbids a CUSTOMER from confirming (403) — blocked before the controller runs', async () => {
    const token = await tokenFor(ROLES.CUSTOMER);
    const res = await request(app).post(`/api/bookings/${fakeId}/confirm`).set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('lets STAFF past the role guard (not 401/403; 404 for a missing booking is fine)', async () => {
    const token = await tokenFor(ROLES.STAFF);
    const res = await request(app).post(`/api/bookings/${fakeId}/confirm`).set(bearer(token));
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe('/api/users/me — available to any authenticated role', () => {
  it('lets a CUSTOMER read their own profile', async () => {
    const token = await tokenFor(ROLES.CUSTOMER);
    const res = await request(app).get('/api/users/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe(ROLES.CUSTOMER);
  });
});
