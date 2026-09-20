/**
 * Non-destructive owner-account fixer. Ensures an OWNER account exists with the
 * email/password from your .env (OWNER_EMAIL / OWNER_PASSWORD / OWNER_NAME) and
 * is email-verified so it can log in. Touches ONLY that one account — no other
 * data is cleared or modified.
 *
 *   node seed/reset-owner.js
 *
 * Behavior:
 *   • If a user with OWNER_EMAIL exists → resets its password, promotes to
 *     OWNER, marks verified, and clears any stale refresh token.
 *   • If not → creates a new OWNER account with those credentials.
 */
const { config } = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { ROLES, USER_STATUS } = require('../src/config/constants');

async function run() {
  const email = (config.owner.email || '').toLowerCase().trim();
  const password = config.owner.password;
  const name = config.owner.name || 'Business Owner';

  if (!email || !password) {
    throw new Error('OWNER_EMAIL and OWNER_PASSWORD must be set in your .env');
  }

  await connectDB(config.db.uri);

  let user = await User.findOne({ email }).select('+passwordHash +refreshTokenHash');
  if (user) {
    user.name = name;
    user.role = ROLES.OWNER;
    user.status = USER_STATUS.ACTIVE;
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    await user.setPassword(password);
    await user.setRefreshToken(null); // drop any stale sessions
    await user.save();
    console.log(`✓ Updated existing account and reset its password: ${email}`);
  } else {
    user = new User({
      name,
      email,
      phone: '+91 90000 00001',
      role: ROLES.OWNER,
      status: USER_STATUS.ACTIVE,
      emailVerifiedAt: new Date(),
    });
    await user.setPassword(password);
    await user.save();
    console.log(`✓ Created new OWNER account: ${email}`);
  }

  console.log('\nYou can now log in with:');
  console.log(`  Email:    ${email}`);
  console.log('  Password: (the value of OWNER_PASSWORD in your .env)');

  await disconnectDB();
}

run().catch((err) => {
  console.error('reset-owner failed:', err.message);
  process.exit(1);
});
