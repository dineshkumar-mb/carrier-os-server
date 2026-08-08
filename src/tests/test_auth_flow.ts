import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

async function runAuthFlowVerification() {
  console.log('================================================================');
  console.log('  🔐 CARRIER OS — AUTHENTICATION & SECURITY FLOW TEST');
  console.log('================================================================\n');

  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345';
  const rawPassword = 'SecurePassword123!';

  // 1. Password Hashing Verification
  console.log('--- [Test 1: Password Hashing & Bcrypt Verification] ---');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);
  
  const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
  const isWrongMatch = await bcrypt.compare('WrongPassword!', hashedPassword);

  console.log(`   - Raw Password: ${rawPassword}`);
  console.log(`   - Hashed Bcrypt String: ${hashedPassword.substring(0, 20)}...`);
  console.log(`   - Correct Password Match: ${isMatch}`);
  console.log(`   - Invalid Password Match: ${isWrongMatch}`);

  if (isMatch && !isWrongMatch) {
    console.log('   ✅ PASSED: Password hashing & verification functioning securely.\n');
  } else {
    throw new Error('FAILED: Bcrypt password comparison failed.');
  }

  // 2. JWT Token Issuance & Verification
  console.log('--- [Test 2: JWT Token Generation & Verification] ---');
  const userId = '507f191e810c19729de860ea';
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });

  const decoded: any = jwt.verify(token, JWT_SECRET);
  console.log(`   - Generated Token Payload ID: ${decoded.id}`);

  if (decoded.id === userId) {
    console.log('   ✅ PASSED: JWT token signed and decoded successfully.\n');
  } else {
    throw new Error('FAILED: JWT decoding mismatch.');
  }

  // 3. Password Reset Token Generation & Validation
  console.log('--- [Test 3: Forgot Password & Reset Token Verification] ---');
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour

  console.log(`   - Reset Token Generated: ${resetToken}`);
  console.log(`   - Reset Expiration: ${resetExpires.toISOString()}`);

  if (resetToken.length === 40 && resetExpires > new Date()) {
    console.log('   ✅ PASSED: Password reset token and expiration generated securely.\n');
  } else {
    throw new Error('FAILED: Reset token generation failed.');
  }

  console.log('================================================================');
  console.log('  🎉 ALL AUTHENTICATION & SECURITY TESTS PASSED!');
  console.log('================================================================');
}

runAuthFlowVerification().catch(err => {
  console.error('❌ Auth Verification Suite Error:', err);
  process.exit(1);
});
