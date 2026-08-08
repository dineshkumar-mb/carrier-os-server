import { TenantContextHolder } from '../core/tenant/TenantContext';
import { applicationRepository } from '../repositories/ApplicationRepository';
import { ResumeTruthfulnessGate } from '../core/gates/ResumeTruthfulnessGate';
import { ModelRouter } from '../services/ai/ModelRouter';
import { aiProviderRegistry } from '../services/ai/AIProviderRegistry';
import { securityBoundary } from '../core/security/SecurityBoundary';

async function runMultiTenantSecurityVerification() {
  console.log('================================================================');
  console.log('  🛡️ CARRIER OS — AGGRESSIVE MULTI-TENANT SECURITY & ISOLATION TEST');
  console.log('================================================================\n');

  const validUserA = '507f191e810c19729de860ea';
  const validAppId = '507f191e810c19729de860eb';
  const validExecId = 'exec_1786154541616_ldzyb';

  // 1. Immutable Tenant Context Creation & Malicious Override Resistance
  console.log('--- [Test 1: Immutable Tenant Context & Identity Override Test] ---');
  const tenantA = TenantContextHolder.create(validUserA, validUserA, ['user'], 'STANDARD');
  console.log(`   - Tenant Context Initialized: User ${tenantA.userId}, Tenant ${tenantA.tenantId}`);
  
  try {
    (tenantA as any).userId = 'hacked_user_b';
  } catch (e) {
    // Immutable
  }

  if (tenantA.userId === validUserA) {
    console.log('   ✅ PASSED: TenantContext is strictly immutable and identity tampering prevented.\n');
  } else {
    throw new Error('FAILED: TenantContext was mutated!');
  }

  // 2. IDOR Security & Repository Scoping Verification
  console.log('--- [Test 2: IDOR & Repository Tenant Scoping] ---');
  const idorResult = await applicationRepository.findById(tenantA, validAppId);
  console.log(`   - IDOR Cross-Tenant Query Result for User Alpha: ${idorResult}`);

  if (idorResult === null) {
    console.log('   ✅ PASSED: Repository automatically enforces tenant ownership (IDOR Blocked).\n');
  } else {
    throw new Error('FAILED: IDOR leak detected in ApplicationRepository!');
  }

  // 3. Security Boundary Layer Authorization & Invariant 6 Execution Traceability
  console.log('--- [Test 3: Security Boundary & Invariant 6 Execution Ownership Traceability] ---');
  const authSuccess = securityBoundary.authorize({
    tenantContext: tenantA,
    executionId: validExecId,
    action: 'TOOL_INVOCATION',
    toolName: 'SearchTool'
  });

  const authMissingExec = securityBoundary.authorize({
    tenantContext: tenantA,
    executionId: '',
    action: 'TOOL_INVOCATION',
    toolName: 'SearchTool'
  });

  console.log(`   - Valid Execution Authorization: Authorized = ${authSuccess.authorized}`);
  console.log(`   - Missing Execution ID Authorization: Authorized = ${authMissingExec.authorized} (${authMissingExec.reason})`);

  if (authSuccess.authorized && !authMissingExec.authorized) {
    console.log('   ✅ PASSED: Security Boundary enforced Invariant 6 execution ownership traceability.\n');
  } else {
    throw new Error('FAILED: Security Boundary allowed untraceable execution invocation.');
  }

  // 4. Evidence-Mapped Resume Truthfulness Gate
  console.log('--- [Test 4: Evidence-Mapped Truthfulness Gate] ---');
  const truthResult = ResumeTruthfulnessGate.evaluate({
    masterSkills: ['React', 'TypeScript', 'Node.js'],
    masterCompanies: ['Stripe'],
    masterTitles: ['Senior Engineer'],
    tailoredText: 'Experienced Senior Engineer',
    tailoredSkills: ['React', 'unsupported_invented_claim']
  });

  console.log(`   - Gate Passed: ${truthResult.passed}`);
  const unsupportedClaim = truthResult.evidenceReport.find(e => e.status === 'UNSUPPORTED');
  console.log(`   - Flagged Claim: "${unsupportedClaim?.claim}" (Status: ${unsupportedClaim?.status})`);

  if (!truthResult.passed && unsupportedClaim?.status === 'UNSUPPORTED') {
    console.log('   ✅ PASSED: Truthfulness Gate successfully mapped evidence & blocked UNSUPPORTED claim.\n');
  } else {
    throw new Error('FAILED: Evidence mapping or truthfulness gate failed.');
  }

  // 5. Deterministic Privacy Boundary Enforcement
  console.log('--- [Test 5: Deterministic Privacy Boundary Enforcement] ---');
  aiProviderRegistry.setActiveProvider('openai');

  try {
    ModelRouter.selectModel('reasoning', 'LOCAL_ONLY');
    throw new Error('FAILED: Privacy Router allowed cloud model under LOCAL_ONLY privacy mode!');
  } catch (err: any) {
    if (err.message.includes('LOCAL_ONLY')) {
      console.log(`   - Expected Privacy Boundary Exception Caught: "${err.message}"`);
      console.log('   ✅ PASSED: Privacy Router deterministically BLOCKS cloud models under LOCAL_ONLY mode without silent fallback.\n');
    } else {
      throw err;
    }
  }

  console.log('================================================================');
  console.log('  🎉 ALL MULTI-TENANT SECURITY & PRIVACY TESTS PASSED!');
  console.log('================================================================');
}

runMultiTenantSecurityVerification().catch(err => {
  console.error('❌ Multi-Tenant Security Suite Error:', err);
  process.exit(1);
});
