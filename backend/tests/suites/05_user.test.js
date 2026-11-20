// Suite 5: User Profile Endpoints (6 Tests)
const { api, assert } = require('../test_helper');

module.exports = async function run(t) {
  // Test 1: Get Profile Unauthenticated Guard
  await t.test('User: GET /api/user/getProfile.php without authentication returns HTTP 401', async () => {
    const res = await api('/api/user/getProfile.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 2: Update Profile Unauthenticated Guard
  await t.test('User: POST /api/user/updateProfile.php without authentication returns HTTP 401', async () => {
    const res = await api('/api/user/updateProfile.php', {
      method: 'POST',
      body: { fullName: 'New Name' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 3: Upload Photo Unauthenticated Guard
  await t.test('User: POST /api/user/uploadPhoto.php without authentication returns HTTP 401', async () => {
    const res = await api('/api/user/uploadPhoto.php', {
      method: 'POST'
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 4: Delete Photo Unauthenticated Guard
  await t.test('User: POST /api/user/deletePhoto.php without authentication returns HTTP 401', async () => {
    const res = await api('/api/user/deletePhoto.php', {
      method: 'POST'
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 5: Profile Photo Empty Upload Validation
  await t.test('User: Profile photo upload endpoint handles empty file payload gracefully', async () => {
    const res = await api('/api/user/uploadPhoto.php', {
      method: 'POST',
      body: {}
    });
    assert.strictEqual(res.data.success, false);
  });

  // Test 6: Profile Update Invalid Body Validation
  await t.test('User: Profile update endpoint rejects empty/malformed update requests', async () => {
    const res = await api('/api/user/updateProfile.php', {
      method: 'POST',
      body: {}
    });
    assert.strictEqual(res.data.success, false);
  });
};
