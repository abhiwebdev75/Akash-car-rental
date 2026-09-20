/**
 * Auth integration tests — registration, login, token-guarded routes.
 */
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB, clearDB } = require('./helpers/testDb');
const { createUser, login } = require('./helpers/factories');
const { ROLES } = require('../../src/config/constants');

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDB);

const { EmailOtp, User } = require('../../src/models');
const { OTP_PURPOSE } = require('../../src/config/constants');

const validRegistration = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '+919000000001',
  password: 'Sup3rSecret!',
};

// The OTP code is only stored hashed, so tests can't read it back. Stub the
// verification step by marking the user verified directly, which mirrors what a
// correct code does. The dedicated verify-flow test exercises the real path via
// a helper that reads the code before hashing is asserted.

describe('POST /api/auth/register', () => {
  it('creates an unverified CUSTOMER account and issues NO tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(validRegistration);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // No tokens until the email is verified.
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.requiresVerification).toBe(true);

    // Account exists but is unverified, and an OTP was created.
    const user = await User.findOne({ email: validRegistration.email });
    expect(user).toBeTruthy();
    expect(user.emailVerifiedAt).toBeFalsy();
    const otp = await EmailOtp.findOne({ userId: user._id, purpose: OTP_PURPOSE.EMAIL_VERIFICATION });
    expect(otp).toBeTruthy();
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

describe('Email verification gate', () => {
  it('blocks login for an unverified customer with EMAIL_NOT_VERIFIED (403)', async () => {
    await createUser({ email: 'unverified@example.com', password: 'Passw0rd!', emailVerified: false });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unverified@example.com', password: 'Passw0rd!' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('verifies the email with a correct code and returns tokens', async () => {
    // Register, then read the hashed OTP row and verify by patching a known code.
    await request(app).post('/api/auth/register').send(validRegistration);
    const user = await User.findOne({ email: validRegistration.email });

    // Replace the stored hash with one for a known code so we can submit it.
    const bcrypt = require('bcryptjs');
    const known = '123456';
    await EmailOtp.updateOne(
      { userId: user._id, purpose: OTP_PURPOSE.EMAIL_VERIFICATION, consumedAt: null },
      { codeHash: await bcrypt.hash(known, 10) }
    );

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: validRegistration.email, code: known });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));

    const after = await User.findById(user._id);
    expect(after.emailVerifiedAt).toBeTruthy();
  });

  it('rejects a wrong verification code with 400', async () => {
    await request(app).post('/api/auth/register').send(validRegistration);
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: validRegistration.email, code: '000000' });
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
    // register issues no token now — log in a pre-verified user to get one.
    await createUser({ email: 'me@example.com', password: 'Passw0rd!', role: ROLES.CUSTOMER });
    const token = await login(app, 'me@example.com', 'Passw0rd!');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@example.com');
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
