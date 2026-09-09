/**
 * Auth integration tests — registration, login, token-guarded routes.
 */
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, clearDB } = require('./helpers/testDb');
const { createUser } = require('./helpers/factories');
const { ROLES } = require('../../src/config/constants');

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDB);

const validRegistration = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '+919000000001',
  password: 'Sup3rSecret!',
};

describe('POST /api/auth/register', () => {
  it('creates a CUSTOMER account and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(validRegistration);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.role).toBe(ROLES.CUSTOMER);
    // Password material must never be serialized.
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validRegistration);
    const res = await request(app).post('/api/auth/register').send(validRegistration);
    expect(res.status).toBe(409);
  });

  it('rejects a too-short password with 400 (validation)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createUser({ email: 'login@example.com', password: 'Passw0rd!', role: ROLES.CUSTOMER });
  });

  it('returns an access token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Passw0rd!' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Passw0rd!' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user when a valid token is supplied', async () => {
    const reg = await request(app).post('/api/auth/register').send(validRegistration);
    const token = reg.body.data.accessToken;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validRegistration.email.toLowerCase());
  });

  it('rejects a request with no token as 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token as 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });
});
