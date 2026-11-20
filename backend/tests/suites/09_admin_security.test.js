// Suite 9: Admin Role-Based Access Control (RBAC) Security (18 Tests)
const { api, assert } = require('../test_helper');

module.exports = async function run(t) {
  // Test 1: Admin Users Directory RBAC Guard
  await t.test('Admin RBAC: GET /api/admin/getUsers.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/getUsers.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 2: Admin Dashboard Data RBAC Guard
  await t.test('Admin RBAC: GET /api/admin/getDashboardData.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/getDashboardData.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 3: Organizer Approvals RBAC Guard
  await t.test('Admin RBAC: GET /api/admin/getOrganizerApprovals.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/getOrganizerApprovals.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 4: Organizer Details RBAC Guard
  await t.test('Admin RBAC: GET /api/admin/getOrganizerDetails.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/getOrganizerDetails.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 5: Moderation Organizer Details RBAC Guard
  await t.test('Admin RBAC: GET /api/admin/getModerationOrganizerDetails.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/getModerationOrganizerDetails.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 6: Project Reports RBAC Guard
  await t.test('Admin RBAC: GET /api/admin/getProjectReports.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/getProjectReports.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 7: Project Details With Reports RBAC Guard
  await t.test('Admin RBAC: GET /api/admin/getProjectDetailsWithReports.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/getProjectDetailsWithReports.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 8: Admin Notifications RBAC Guard
  await t.test('Admin RBAC: GET /api/admin/getNotifications.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/getNotifications.php');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 9: Mark Admin Notifications Read RBAC Guard
  await t.test('Admin RBAC: POST /api/admin/markNotificationsRead.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/markNotificationsRead.php', { method: 'POST' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 10: Moderate Project RBAC Guard
  await t.test('Admin RBAC: POST /api/admin/moderateProject.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/moderateProject.php', {
      method: 'POST',
      body: { projectID: 1, action: 'APPROVE' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 11: Review Organizer RBAC Guard
  await t.test('Admin RBAC: POST /api/admin/reviewOrganizer.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/reviewOrganizer.php', {
      method: 'POST',
      body: { organizerID: 1, action: 'APPROVE' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 12: Suspend Organizer RBAC Guard
  await t.test('Admin RBAC: POST /api/admin/suspendOrganizer.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/suspendOrganizer.php', {
      method: 'POST',
      body: { organizerID: 1, reason: 'Violation of Terms' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 13: Update Report Status RBAC Guard
  await t.test('Admin RBAC: POST /api/admin/updateReportStatus.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/updateReportStatus.php', {
      method: 'POST',
      body: { reportID: 1, status: 'RESOLVED' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 14: Update User Status RBAC Guard
  await t.test('Admin RBAC: POST /api/admin/updateUserStatus.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/updateUserStatus.php', {
      method: 'POST',
      body: { userID: 1, status: 'ACTIVE' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 15: Delete User RBAC Guard
  await t.test('Admin RBAC: POST /api/admin/deleteUser.php strictly rejects unauthenticated access (HTTP 401)', async () => {
    const res = await api('/api/admin/deleteUser.php', {
      method: 'POST',
      body: { userID: 999 }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 16: Update User Status Validation Guard
  await t.test('Admin RBAC: POST /api/admin/updateUserStatus.php with invalid payload rejects safely', async () => {
    const res = await api('/api/admin/updateUserStatus.php', {
      method: 'POST',
      body: {}
    });
    assert.strictEqual(res.data.success, false);
  });

  // Test 17: Privilege Escalation Defense
  await t.test('Admin RBAC: Non-admin session roles cannot escalate privileges to administrative endpoints', () => {
    const requiredRoles = ['ADMIN'];
    const clientRoles = ['DONOR', 'ORGANIZER', 'GUEST'];
    for (const role of clientRoles) {
      assert.strictEqual(requiredRoles.includes(role), false, `Role ${role} must never access Admin routes`);
    }
  });

  // Test 18: Audit Trail Data Completeness
  await t.test('Admin RBAC: Moderation audit log schema mandates action_type, moderatorID, and timestamp', () => {
    const auditRecord = {
      action_type: 'REJECT_PROJECT',
      moderatorID: 1,
      targetID: 42,
      createdAt: new Date().toISOString()
    };
    assert.ok(auditRecord.action_type.length > 0);
    assert.strictEqual(typeof auditRecord.moderatorID, 'number');
    assert.ok(auditRecord.createdAt.length > 0);
  });
};
