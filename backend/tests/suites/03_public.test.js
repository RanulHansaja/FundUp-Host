// Suite 3: Public & Discovery Endpoints (6 Tests)
const { api, assert } = require('../test_helper');

module.exports = async function run(t) {
  // Test 1: Home Stats API
  await t.test('Public: GET /api/public/getHomeStats.php returns HTTP 200 and platform metrics', async () => {
    const res = await api('/api/public/getHomeStats.php');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data !== null && typeof res.data.data === 'object');
    assert.strictEqual(typeof res.data.data.universitiesSupported, 'number');
    assert.strictEqual(typeof res.data.data.totalFundsRaised, 'number');
  });

  // Test 2: Active Projects List API
  await t.test('Public: GET /api/projects/getProjects.php returns HTTP 200 and active projects array', async () => {
    const res = await api('/api/projects/getProjects.php');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
  });

  // Test 3: Universities Lookup List API
  await t.test('Public: GET /api/universities/getUniversities.php returns seeded university directory', async () => {
    const res = await api('/api/universities/getUniversities.php');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length > 0, 'Should return at least 1 seeded university');
    assert.ok('domainID' in res.data[0] || 'universityName' in res.data[0]);
  });

  // Test 4: Commercializations Projects API
  await t.test('Public: GET /api/public/getCommercializations.php returns HTTP 200 and valid JSON', async () => {
    const res = await api('/api/public/getCommercializations.php');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.data, 'object');
    assert.ok(res.data !== null);
  });

  // Test 5: Top Donors Leaderboard API
  await t.test('Public: GET /api/public/getTopDonors.php returns HTTP 200 and donor list', async () => {
    const res = await api('/api/public/getTopDonors.php');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.data, 'object');
    assert.ok(res.data !== null);
  });

  // Test 6: Security Check - Public Endpoints Never Leak Passwords or Keys
  await t.test('Public: Discovery endpoints do not leak password hashes or secret tokens', async () => {
    const res = await api('/api/public/getHomeStats.php');
    const raw = res.rawText.toLowerCase();
    assert.strictEqual(raw.includes('password_hash'), false);
    assert.strictEqual(raw.includes('db_pass'), false);
    assert.strictEqual(raw.includes('secret_key'), false);
  });
};
