#!/usr/bin/env node

/**
 * FundUp Master Automated Test Runner
 * Executes all 9 test suites covering services, helpers, and all 56 backend endpoints.
 *
 * Usage:
 *   node backend/tests/runner.js
 *   TEST_API_URL=https://fundup-backend-*.azurewebsites.net node backend/tests/runner.js
 */

const { BASE_URL } = require('./test_helper');

const SUITES = [
  { name: 'Suite 1: Services & Core Architecture', file: './suites/01_services.test.js' },
  { name: 'Suite 2: Helpers & Config Logic', file: './suites/02_helpers.test.js' },
  { name: 'Suite 3: Public & Discovery Endpoints', file: './suites/03_public.test.js' },
  { name: 'Suite 4: Authentication & Security Endpoints', file: './suites/04_auth.test.js' },
  { name: 'Suite 5: User Profile Endpoints', file: './suites/05_user.test.js' },
  { name: 'Suite 6: Projects & Comments Endpoints', file: './suites/06_projects_comments.test.js' },
  { name: 'Suite 7: Donor Operations Endpoints', file: './suites/07_donor.test.js' },
  { name: 'Suite 8: Organizer Operations Endpoints', file: './suites/08_organizer.test.js' },
  { name: 'Suite 9: Admin RBAC Security Matrix', file: './suites/09_admin_security.test.js' },
];

async function main() {
  const startTime = Date.now();
  console.log(`\n======================================================================`);
  console.log(`🚀 FundUp Backend Full-Coverage Automated Test Runner`);
  console.log(`🎯 Target API URL: ${BASE_URL}`);
  console.log(`📦 Loaded Test Suites: ${SUITES.length}`);
  console.log(`======================================================================\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  const failureDetails = [];

  for (const suite of SUITES) {
    console.log(`\n📂 Running ${suite.name}...`);
    let suitePassed = 0;
    let suiteFailed = 0;

    const t = {
      async test(testName, fn) {
        try {
          await fn();
          console.log(`   ✅ PASS: ${testName}`);
          suitePassed++;
          totalPassed++;
        } catch (err) {
          console.error(`   ❌ FAIL: ${testName}`);
          console.error(`      Reason: ${err.message}`);
          suiteFailed++;
          totalFailed++;
          failureDetails.push({ suite: suite.name, test: testName, error: err.message });
        }
      }
    };

    try {
      const suiteModule = require(suite.file);
      await suiteModule(t);
      console.log(`   📊 ${suite.name} Results: ${suitePassed} passed, ${suiteFailed} failed`);
    } catch (suiteErr) {
      console.error(`   💥 Fatal Suite Error in ${suite.name}: ${suiteErr.message}`);
      totalFailed++;
      failureDetails.push({ suite: suite.name, test: 'Suite Execution', error: suiteErr.message });
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = totalPassed + totalFailed;

  console.log(`\n======================================================================`);
  console.log(`🏁 FundUp Automated Test Execution Summary`);
  console.log(`======================================================================`);
  console.log(`   Total Tests Run: ${totalTests}`);
  console.log(`   Passed:          ${totalPassed} ✅`);
  console.log(`   Failed:          ${totalFailed} ${totalFailed > 0 ? '❌' : ''}`);
  console.log(`   Duration:        ${durationSec}s`);
  console.log(`======================================================================\n`);

  if (totalFailed > 0) {
    console.error(`🚨 Test Failures Detected (${totalFailed}):`);
    failureDetails.forEach((f, idx) => {
      console.error(`   ${idx + 1}. [${f.suite}] ${f.test} -> ${f.error}`);
    });
    console.error(`\n🛑 CI/CD Pipeline Gated: Deployment aborted to protect production.\n`);
    process.exit(1);
  } else {
    console.log(`✨ ALL ${totalPassed} TESTS PASSED GREEN! System verified for deployment. 🚀\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Unexpected runner error:', err);
  process.exit(1);
});
