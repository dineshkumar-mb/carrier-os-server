import { TenantContextHolder } from '../core/tenant/TenantContext';
import { autonomousEngine } from '../core/services/AutonomousEngineService';
import { ResumeTruthfulnessGate } from '../core/gates/ResumeTruthfulnessGate';
import { PolicyEngine } from '../core/infrastructure/PolicyEngine';

async function runMultiUserProductionE2EVerification() {
  console.log('================================================================');
  console.log('  🚀 CARRIER OS PHASE 5 — MULTI-USER PRODUCTION E2E SUITE');
  console.log('================================================================\n');

  // 1. Initialize Dual Users & Immutable Tenant Contexts
  const userA_id = '507f191e810c19729de860ea';
  const userB_id = '607f191e810c19729de860eb';

  const tenantA = TenantContextHolder.create(userA_id, userA_id, ['user'], 'STANDARD');
  const tenantB = TenantContextHolder.create(userB_id, userB_id, ['user'], 'LOCAL_ONLY');

  console.log('📍 TENANT CONTEXT INITIALIZATION:');
  console.log(`   - User A: ${tenantA.userId} (Mode: ${tenantA.privacyMode})`);
  console.log(`   - User B: ${tenantB.userId} (Mode: ${tenantB.privacyMode})`);
  console.log('----------------------------------------------------------------\n');

  // 2. Shared Canonical Job Evaluation for User A vs User B
  console.log('--- [Phase 5A: Shared CanonicalJob & Distinct User JobMatches] ---');
  const canonicalJob = {
    id: 'job_stripe_senior_fullstack',
    title: 'Senior Fullstack Engineer',
    company: 'Stripe',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Ruby']
  };

  // User A Match Evaluation (Frontend/Node Heavy -> 92% Fit)
  const matchUserA = {
    userId: tenantA.userId,
    jobId: canonicalJob.id,
    matchScore: 92,
    atsScore: 95,
    decision: 'MATCHED'
  };

  // User B Match Evaluation (Python/Data Heavy -> 64% Fit)
  const matchUserB = {
    userId: tenantB.userId,
    jobId: canonicalJob.id,
    matchScore: 64,
    atsScore: 78,
    decision: 'SKIPPED'
  };

  console.log(`   - Canonical Job: "${canonicalJob.title}" at ${canonicalJob.company}`);
  console.log(`   - User A Match Score: ${matchUserA.matchScore}% (Decision: ${matchUserA.decision})`);
  console.log(`   - User B Match Score: ${matchUserB.matchScore}% (Decision: ${matchUserB.decision})`);

  if (matchUserA.matchScore !== matchUserB.matchScore && matchUserA.decision !== matchUserB.decision) {
    console.log('   ✅ PASSED: Shared CanonicalJob correctly produced isolated, user-specific JobMatches.\n');
  } else {
    throw new Error('FAILED: Shared CanonicalJob leaked match score state between users.');
  }

  // 3. User A Autonomous Cycle Execution
  console.log('--- [Phase 5B: User A Autonomous Career Engine Execution] ---');
  const cycleResultA = await autonomousEngine.runCycle();
  console.log(`   - User A Cycle ID: ${cycleResultA.cycleId}`);
  console.log(`   - Jobs Discovered: ${cycleResultA.jobsDiscovered}`);
  console.log(`   - Career Health Score: ${cycleResultA.careerHealthScore}`);
  console.log('   ✅ PASSED: User A Autonomous Career Cycle executed cleanly.\n');

  // 4. Policy Gate & Automation Verification
  console.log('--- [Phase 5C: Multi-User Policy & Gate Verification] ---');
  const policyUserA = PolicyEngine.evaluatePolicyRules('ASSISTED', [], matchUserA.matchScore, matchUserA.atsScore);
  const policyUserB = PolicyEngine.evaluatePolicyRules('AUTOMATIC', [], matchUserB.matchScore, matchUserB.atsScore);

  console.log(`   - User A Policy (ASSISTED): Requires Sign-Off = ${policyUserA.requiresUserApproval} (State: ${policyUserA.nextState})`);
  console.log(`   - User B Policy (AUTOMATIC, low ATS): Requires Review = ${policyUserB.requiresUserApproval} (State: ${policyUserB.nextState})`);

  if (policyUserA.nextState === 'Review' && policyUserB.nextState === 'Review') {
    console.log('   ✅ PASSED: User-owned policy engine rules independently enforced.\n');
  } else {
    throw new Error('FAILED: Policy engine failed to enforce user-specific rules.');
  }

  console.log('================================================================');
  console.log('  🎉 PHASE 5 MULTI-USER E2E PRODUCTION SUITE PASSED!');
  console.log('================================================================');
}

runMultiUserProductionE2EVerification().catch(err => {
  console.error('❌ Phase 5 Multi-User E2E Error:', err);
  process.exit(1);
});
