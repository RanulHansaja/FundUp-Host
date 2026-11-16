// Automated Baseline API Smoke Tests for FundUp
// Run: node backend/tests/api_test.js
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:8000';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Baseline API Tests against: ${BASE_URL}`);
  console.log(`======================================================\n`);
  
  let passed = 0;
  let failed = 0;

  async function test(testName, fn) {
    try {
      await fn();
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${testName}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  // 1. Health & Home Stats
  await test('[1/4] Public Stats API returns success and platform counters', async () => {
    const res = await fetch(`${BASE_URL}/api/public/getHomeStats.php`);
    const rawText = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${rawText}`);
    const data = JSON.parse(rawText);
    if (!data.success || typeof data.data?.universitiesSupported !== 'number') {
      throw new Error(`Unexpected response payload: ${rawText}`);
    }
  });

  // 2. Projects List
  await test('[2/4] Projects API returns active projects array', async () => {
    const res = await fetch(`${BASE_URL}/api/projects/getProjects.php`);
    const rawText = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${rawText}`);
    const data = JSON.parse(rawText);
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(`Expected data.data to be an array, got: ${rawText}`);
    }
  });

  // 3. Universities Lookup Table
  await test('[3/4] Universities Lookup API returns seeded university list', async () => {
    const res = await fetch(`${BASE_URL}/api/universities/getUniversities.php`);
    const rawText = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${rawText}`);
    const data = JSON.parse(rawText);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Expected non-empty array of universities`);
    }
  });

  // 4. Security Check: Invalid Login Rejection
  await test('[4/4] Auth Security rejects invalid login credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake_test@fundup.com', password: 'wrongpassword' }),
    });
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Invalid JSON response: ${rawText}`);
    }
    if (data.success === true) {
      throw new Error(`Security flaw: Backend accepted fake credentials!`);
    }
  });

  console.log(`\n======================================================`);
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
