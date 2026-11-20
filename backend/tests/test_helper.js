// Shared Test Helper for FundUp Automated Test Suite
const assert = require('node:assert');

const BASE_URL = (process.env.TEST_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function api(path, options = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = { ...options.headers };
  
  if (options.body && typeof options.body === 'object' && !(options.body instanceof Buffer)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const rawText = await res.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText;
  }

  return {
    status: res.status,
    ok: res.ok,
    data,
    headers: res.headers,
    rawText,
  };
}

module.exports = {
  BASE_URL,
  api,
  assert,
};
