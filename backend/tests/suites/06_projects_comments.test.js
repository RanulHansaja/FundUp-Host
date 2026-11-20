// Suite 6: Projects & Comments Endpoints (8 Tests)
const { api, assert } = require('../test_helper');

module.exports = async function run(t) {
  // Test 1: Project Details missing ID
  await t.test('Projects: GET /api/projects/getProjectDetails.php without ID handles safely', async () => {
    const res = await api('/api/projects/getProjectDetails.php');
    assert.strictEqual(res.data.success, false);
  });

  // Test 2: Project Details non-existent ID
  await t.test('Projects: GET /api/projects/getProjectDetails.php with non-existent ID returns not found/error', async () => {
    const res = await api('/api/projects/getProjectDetails.php?id=999999');
    assert.strictEqual(res.data.success, false);
  });

  // Test 3: Project Details SQL Injection prevention
  await t.test('Projects: GET /api/projects/getProjectDetails.php with SQL injection string is safely handled', async () => {
    const res = await api("/api/projects/getProjectDetails.php?id=1'%20OR%20'1'='1");
    assert.ok(res.status < 500, 'Server must safely handle invalid parameter types');
  });

  // Test 4: Report Project Unauthenticated Guard
  await t.test('Projects: POST /api/projects/reportProject.php without session returns HTTP 401', async () => {
    const res = await api('/api/projects/reportProject.php', {
      method: 'POST',
      body: { projectID: 1, reason: 'Spam' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 5: Report Project payload validation
  await t.test('Projects: POST /api/projects/reportProject.php missing required fields rejects gracefully', async () => {
    const res = await api('/api/projects/reportProject.php', {
      method: 'POST',
      body: {}
    });
    assert.strictEqual(res.data.success, false);
  });

  // Test 6: Get Public Comments
  await t.test('Comments: GET /api/comments/getComments.php returns HTTP 200 and comment list', async () => {
    const res = await api('/api/comments/getComments.php');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
  });

  // Test 7: Submit Comment Unauthenticated Guard
  await t.test('Comments: POST /api/comments/submitComment.php without session returns HTTP 401', async () => {
    const res = await api('/api/comments/submitComment.php', {
      method: 'POST',
      body: { comment: 'Great initiative!' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  // Test 8: Comment Validation
  await t.test('Comments: Empty comment body is rejected by validation guard', async () => {
    const res = await api('/api/comments/submitComment.php', {
      method: 'POST',
      body: { comment: '' }
    });
    assert.strictEqual(res.data.success, false);
  });
};
