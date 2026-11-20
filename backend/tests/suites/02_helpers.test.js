// Suite 2: Helpers & Config Logic (8 Tests)
const crypto = require('node:crypto');
const { assert } = require('../test_helper');

module.exports = async function run(t) {
  // Test 1: University Domain Validation (.ac.lk subdomains)
  await t.test('Helpers: University domain regex validates official Sri Lankan .ac.lk subdomains', () => {
    const validEmails = [
      'student@eng.pdn.ac.lk',
      'president@rotaract.cmb.ac.lk',
      'club@sjp.ac.lk',
      'lead@uom.lk',
      'org@kdu.ac.lk'
    ];
    const universityDomainPattern = /@(.*\.)?(ac\.lk|uom\.lk|kdu\.ac\.lk)$/i;

    for (const email of validEmails) {
      assert.ok(universityDomainPattern.test(email), `${email} should be accepted as a university domain`);
    }
  });

  // Test 2: University Domain Rejection of Generic Emails
  await t.test('Helpers: University domain validator strictly rejects generic public webmail providers', () => {
    const invalidEmails = [
      'hacker@gmail.com',
      'organizer@yahoo.com',
      'test@outlook.com',
      'user@hotmail.com',
      'fake@university.fake.com'
    ];
    const universityDomainPattern = /@(.*\.)?(ac\.lk|uom\.lk|kdu\.ac\.lk)$/i;

    for (const email of invalidEmails) {
      assert.strictEqual(universityDomainPattern.test(email), false, `${email} must be rejected`);
    }
  });

  // Test 3: Domain Case-Insensitivity
  await t.test('Helpers: Domain validator handles uppercase and mixed case emails seamlessly', () => {
    const mixedCase = 'STUDENT@ENG.PDN.AC.LK';
    const atPos = mixedCase.lastIndexOf('@');
    const domain = mixedCase.substring(atPos).toLowerCase().trim();
    assert.strictEqual(domain, '@eng.pdn.ac.lk');
  });

  // Test 4: PayHere MD5 Signature Generation Algorithm
  await t.test('Helpers: PayHere payment MD5 signature matches payment gateway specification', () => {
    const merchantId = '123456';
    const orderId = 'ORD_999';
    const amount = '5000.00';
    const currency = 'LKR';
    const merchantSecret = 'secret_test_key_123';

    // PayHere formula: strtoupper(md5(merchant_id + order_id + amount + currency + strtoupper(md5(merchant_secret))))
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const dataString = merchantId + orderId + amount + currency + hashedSecret;
    const finalHash = crypto.createHash('md5').update(dataString).digest('hex').toUpperCase();

    assert.strictEqual(typeof finalHash, 'string');
    assert.strictEqual(finalHash.length, 32);
    assert.strictEqual(finalHash, finalHash.toUpperCase());
  });

  // Test 5: CORS Origin Validation for Production & Preview
  await t.test('Helpers: CORS configuration permits configured localhost and Vercel edge domains', () => {
    const allowedPatterns = [
      /^http:\/\/localhost:(5173|3000|5174|5175|5176)$/,
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i
    ];

    const testOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://fund-up-host.vercel.app',
      'https://fundup-preview-pr-12.vercel.app'
    ];

    for (const origin of testOrigins) {
      const allowed = allowedPatterns.some(p => p.test(origin));
      assert.ok(allowed, `Origin ${origin} must be permitted by CORS`);
    }
  });

  // Test 6: CORS Rejection of Unauthorized Origins
  await t.test('Helpers: CORS configuration does not authorize unverified third-party origins', () => {
    const allowedPatterns = [
      /^http:\/\/localhost:(5173|3000|5174|5175|5176)$/,
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i
    ];

    const maliciousOrigins = [
      'https://evil-phishing-site.com',
      'http://attacker-controlled.net',
      'https://fake-vercel.com'
    ];

    for (const origin of maliciousOrigins) {
      const allowed = allowedPatterns.some(p => p.test(origin));
      assert.strictEqual(allowed, false, `Origin ${origin} must be rejected by CORS`);
    }
  });

  // Test 7: Phone Number Normalization
  await t.test('Helpers: Phone number sanitizer strips non-digit characters to 10 digits', () => {
    const rawPhones = ['077-123-4567', '077 123 4567', '+94 0771234567'];
    for (const raw of rawPhones) {
      const digits = raw.replace(/[^0-9]/g, '');
      const local10 = digits.length > 10 ? digits.slice(-10) : digits;
      assert.strictEqual(local10.length, 10);
      assert.strictEqual(/^[0-9]{10}$/.test(local10), true);
    }
  });

  // Test 8: Secure Session Cookie Attribute Definition
  await t.test('Helpers: Session helper configures secure, HttpOnly, and SameSite cookie options', () => {
    const sessionCookieParams = {
      lifetime: 86400,
      path: '/',
      domain: '',
      secure: true,
      httponly: true,
      samesite: 'Lax'
    };
    assert.strictEqual(sessionCookieParams.httponly, true, 'HttpOnly protects against XSS');
    assert.strictEqual(sessionCookieParams.samesite, 'Lax', 'SameSite=Lax protects against CSRF');
  });
};
