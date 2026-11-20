// Suite 4: Authentication & Security Endpoints (10 Tests)
const { api, assert } = require('../test_helper');

module.exports = async function run(t) {
  // Test 1: Login missing credentials
  await t.test('Auth: POST /api/auth/login.php with empty payload rejects with required error', async () => {
    const res = await api('/api/auth/login.php', {
      method: 'POST',
      body: { email: '', password: '' }
    });
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.includes('required'));
  });

  // Test 2: Login wrong password
  await t.test('Auth: POST /api/auth/login.php with incorrect password strictly rejects', async () => {
    const res = await api('/api/auth/login.php', {
      method: 'POST',
      body: { email: 'fake_user@fundup.com', password: 'definitely_wrong_password_123' }
    });
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.toLowerCase().includes('invalid'));
  });

  // Test 3: Login non-existent email
  await t.test('Auth: POST /api/auth/login.php with non-existent email returns generic safe error', async () => {
    const res = await api('/api/auth/login.php', {
      method: 'POST',
      body: { email: 'non_existent_9999@fundup.com', password: 'password123' }
    });
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.toLowerCase().includes('invalid'));
  });

  // Test 4: Login SQL Injection Defense
  await t.test('Auth: POST /api/auth/login.php safely neutralizes SQL injection attempts', async () => {
    const res = await api('/api/auth/login.php', {
      method: 'POST',
      body: { email: "' OR '1'='1' --", password: "' OR '1'='1" }
    });
    assert.strictEqual(res.data.success, false);
    assert.ok(res.status < 500, 'Server must handle injection safely without 500 error');
  });

  // Test 5: Register missing fields
  await t.test('Auth: POST /api/auth/register.php with missing fields rejects with required validation', async () => {
    const res = await api('/api/auth/register.php', {
      method: 'POST',
      body: { fullName: '', email: '', password: '', confirmPassword: '', phone: '' }
    });
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.toLowerCase().includes('required'));
  });

  // Test 6: Register invalid phone number format
  await t.test('Auth: POST /api/auth/register.php rejects invalid phone numbers (< 10 digits)', async () => {
    const res = await api('/api/auth/register.php', {
      method: 'POST',
      body: {
        fullName: 'Test User',
        email: 'test_phone@fundup.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        phone: '12345'
      }
    });
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.toLowerCase().includes('phone'));
  });

  // Test 7: Register password mismatch
  await t.test('Auth: POST /api/auth/register.php rejects mismatched password confirmation', async () => {
    const res = await api('/api/auth/register.php', {
      method: 'POST',
      body: {
        fullName: 'Test User',
        email: 'test_mismatch@fundup.com',
        password: 'Password@123',
        confirmPassword: 'DifferentPassword@456',
        phone: '0771234567'
      }
    });
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.toLowerCase().includes('match'));
  });

  // Test 8: Forgot Password empty email
  await t.test('Auth: POST /api/auth/forgot-password.php with empty email fails validation', async () => {
    const res = await api('/api/auth/forgot-password.php', {
      method: 'POST',
      body: { email: '' }
    });
    assert.strictEqual(res.data.success, false);
  });

  // Test 9: Reset Password missing token
  await t.test('Auth: POST /api/auth/reset-password.php with invalid or missing token rejects', async () => {
    const res = await api('/api/auth/reset-password.php', {
      method: 'POST',
      body: { token: 'invalid_expired_token_123', password: 'NewPassword@123' }
    });
    assert.strictEqual(res.data.success, false);
  });

  // Test 10: Logout endpoint
  await t.test('Auth: POST /api/auth/logout.php clears session and responds with success', async () => {
    const res = await api('/api/auth/logout.php', {
      method: 'POST'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });
};
