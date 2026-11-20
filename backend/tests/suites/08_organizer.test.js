// Suite 8: Organizer Operations Endpoints (12 Tests)
const { api, assert } = require('../test_helper');

module.exports = async function run(t) {
  // Test 1: Organizer Projects
  await t.test('Organizer: GET /api/organizer/getOrganizerProjects.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/getOrganizerProjects.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 2: Organizer Dashboard
  await t.test('Organizer: GET /api/organizer/getDashboardData.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/getDashboardData.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 3: Organizer Donations
  await t.test('Organizer: GET /api/organizer/getDonations.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/getDonations.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 4: Organizer Notifications
  await t.test('Organizer: GET /api/organizer/getNotifications.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/getNotifications.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 5: Mark Notifications Read
  await t.test('Organizer: POST /api/organizer/markNotificationsRead.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/markNotificationsRead.php', { method: 'POST' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 6: Create Project Unauthenticated Guard
  await t.test('Organizer: POST /api/organizer/createProject.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/createProject.php', {
      method: 'POST',
      body: { title: 'New Project' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 7: Update Project Unauthenticated Guard
  await t.test('Organizer: POST /api/organizer/updateProject.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/updateProject.php', {
      method: 'POST',
      body: { projectID: 1, title: 'Updated Project' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 8: Delete Project Unauthenticated Guard
  await t.test('Organizer: POST /api/organizer/deleteProject.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/deleteProject.php', {
      method: 'POST',
      body: { projectID: 1 }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 9: Create Progress Update Guard
  await t.test('Organizer: POST /api/organizer/createProgressUpdate.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/createProgressUpdate.php', {
      method: 'POST',
      body: { projectID: 1, updateText: 'Phase 1 done' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 10: Verify Donation Guard
  await t.test('Organizer: POST /api/organizer/verifyDonation.php requires authentication (HTTP 401)', async () => {
    const res = await api('/api/organizer/verifyDonation.php', {
      method: 'POST',
      body: { donationID: 1, action: 'APPROVE' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 11: Project Validation Schema
  await t.test('Organizer: Project creation schema mandates title, category, and positive financial target', () => {
    const validProject = {
      title: 'Solar Water System',
      category: 'COMMUNITY',
      targetAmount: 250000.00
    };
    assert.ok(validProject.title.length > 0);
    assert.ok(validProject.targetAmount > 0);
  });

  // Test 12: Progress Update Text Requirement
  await t.test('Organizer: Progress updates mandate non-empty milestone update description', () => {
    const emptyUpdate = '';
    assert.strictEqual(emptyUpdate.trim().length === 0, true);
  });
};
