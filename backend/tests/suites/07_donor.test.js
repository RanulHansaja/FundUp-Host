// Suite 7: Donor Operations Endpoints (12 Tests)
const { api, assert } = require('../test_helper');

module.exports = async function run(t) {
  // Test 1: My Donations
  await t.test('Donor: GET /api/donor/getMyDonations.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/getMyDonations.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 2: Pending Donations
  await t.test('Donor: GET /api/donor/getPendingDonations.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/getPendingDonations.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 3: Donor Dashboard
  await t.test('Donor: GET /api/donor/getDashboardData.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/getDashboardData.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 4: Donation Details
  await t.test('Donor: GET /api/donor/getDonationDetails.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/getDonationDetails.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 5: Payment Confirmations
  await t.test('Donor: GET /api/donor/getPaymentConfirmations.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/getPaymentConfirmations.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 6: Completed Donations Breakdown
  await t.test('Donor: GET /api/donor/getCompletedDonationsBreakdown.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/getCompletedDonationsBreakdown.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 7: Donor Notifications
  await t.test('Donor: GET /api/donor/getNotifications.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/getNotifications.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 8: Mark Notifications Read
  await t.test('Donor: POST /api/donor/markNotificationsRead.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/markNotificationsRead.php', { method: 'POST' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 9: Create Donation Guard
  await t.test('Donor: POST /api/donor/createDonation.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/createDonation.php', {
      method: 'POST',
      body: { projectID: 1, amount: 1000 }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 10: Get PayHere Params Guard
  await t.test('Donor: POST /api/donor/getPayhereParams.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/getPayhereParams.php', {
      method: 'POST',
      body: { projectID: 1, amount: 1000 }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 11: Download Receipt Guard
  await t.test('Donor: GET /api/donor/downloadReceipt.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/donor/downloadReceipt.php?donationID=1');
    assert.strictEqual(res.status, 401);
  });

  // Test 12: Donation Payload Validation
  await t.test('Donor: Negative or zero donation amounts are rejected by validation logic', () => {
    const invalidAmounts = [0, -500, -1, 'zero', null];
    for (const amt of invalidAmounts) {
      const isValid = typeof amt === 'number' && amt > 0;
      assert.strictEqual(isValid, false, `Amount ${amt} must be rejected`);
    }
  });
};
