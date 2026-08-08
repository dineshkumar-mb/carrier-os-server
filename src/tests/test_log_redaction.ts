import { LogSanitizer } from '../utils/LogSanitizer';

async function runLogRedactionVerification() {
  console.log('================================================================');
  console.log('  🧹 CARRIER OS — AUTOMATED LOG REDACTION & SAFETY TEST');
  console.log('================================================================\n');

  const testPayload = {
    userId: 'user_123',
    username: 'candidate@example.com',
    password: 'MySecretPassword123!',
    authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    apiKey: 'sk-proj-1234567890abcdef',
    nestedData: {
      cookie: 'session_id=abcdef123456',
      secret: 'super_secret_vault_token'
    }
  };

  const sanitized = LogSanitizer.sanitize(testPayload);

  console.log('📍 ORIGINAL PAYLOAD REDACTION CHECK:');
  console.log(`   - Password:      ${sanitized.password}`);
  console.log(`   - Authorization: ${sanitized.authorization}`);
  console.log(`   - ApiKey:        ${sanitized.apiKey}`);
  console.log(`   - Cookie:        ${sanitized.nestedData.cookie}`);
  console.log(`   - Secret:        ${sanitized.nestedData.secret}`);

  if (
    sanitized.password === '[REDACTED]' &&
    sanitized.authorization === '[REDACTED]' &&
    sanitized.apiKey === '[REDACTED]' &&
    sanitized.nestedData.cookie === '[REDACTED]' &&
    sanitized.nestedData.secret === '[REDACTED]'
  ) {
    console.log('\n   ✅ PASSED: All sensitive credentials & tokens successfully redacted!');
  } else {
    throw new Error('FAILED: Sensitive credential leaked in sanitized log!');
  }

  console.log('\n================================================================');
  console.log('  🎉 LOG REDACTION TEST COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runLogRedactionVerification().catch(err => {
  console.error('❌ Log Redaction Test Error:', err);
  process.exit(1);
});
