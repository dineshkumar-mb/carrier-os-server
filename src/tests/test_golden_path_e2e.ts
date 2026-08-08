import { agentRegistry } from '../core/agents/AgentRegistry';
import { plannerAgent } from '../core/agents/PlannerAgent';
import { PolicyEngine } from '../core/infrastructure/PolicyEngine';
import { DuplicateCheckGate } from '../core/gates/DuplicateCheckGate';
import { ResumeQualityGate } from '../core/gates/ResumeQualityGate';
import { RiskScoreGate } from '../core/gates/RiskScoreGate';
import { autonomousEngine } from '../core/services/AutonomousEngineService';
import mongoose from 'mongoose';
import connection from '../config/redis';

async function runGoldenPathE2EVerification() {
  console.log('================================================================');
  console.log('  🚀 CARRIER OS — GOLDEN PATH E2E & BOUNDARY TEST SUITE');
  console.log('================================================================\n');

  // 0. Environment Telemetry Inspection
  const isMongoConnected = mongoose.connection.readyState === 1;
  const isRedisConnected = connection.status === 'ready';
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  console.log('📍 ENVIRONMENT TELEMETRY STATUS:');
  console.log(`   - Environment Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   - Storage Mode:     ${isMongoConnected ? 'MONGODB (Production)' : 'IN-MEMORY FALLBACK (Dev)'}`);
  console.log(`   - Queue Mode:       ${isRedisConnected ? 'REDIS (Production)' : 'IN-MEMORY QUEUE (Dev)'}`);
  console.log(`   - AI Engine Mode:   ${hasOpenAI ? 'OPENAI GPT-4 (Production)' : 'HEURISTIC FALLBACK (Dev)'}`);
  console.log('----------------------------------------------------------------\n');

  // 1. Golden Path Autonomous Engine Execution Test
  console.log('--- [Phase 1: Golden Path Autonomous Cycle Execution] ---');
  const cycleResult = await autonomousEngine.runCycle();
  
  console.log(`✅ Autonomous Cycle ID: ${cycleResult.cycleId}`);
  console.log(`✅ Jobs Discovered: ${cycleResult.jobsDiscovered}`);
  console.log(`✅ Auto-Applied Count: ${cycleResult.autoAppliedCount}`);
  console.log(`✅ Queued for Approval: ${cycleResult.queuedForApprovalCount}`);
  console.log(`✅ Career Health Score: ${cycleResult.careerHealthScore}`);
  
  if (cycleResult.jobsDiscovered > 0) {
    console.log('PASSED: Golden Path Cycle Executed Successfully!\n');
  } else {
    throw new Error('Golden Path Execution failed to discover jobs.');
  }

  // 2. Failure Mode Boundary Tests
  console.log('--- [Phase 2: Failure Mode & Quality Gate Boundary Tests] ---');

  // Test 2A: ATS Score Below Threshold Block
  console.log('🧪 Test 2A: Evaluating ATS Score below threshold (65% vs 90% floor)...');
  const lowAtsGate = ResumeQualityGate.evaluate(65, 90);
  console.log(`   - Gate Passed: ${lowAtsGate.passed}`);
  console.log(`   - Gate Rationale: "${lowAtsGate.reason}"`);
  if (!lowAtsGate.passed) {
    console.log('   ✅ PASSED: Low ATS Score correctly BLOCKED by ResumeQualityGate.\n');
  } else {
    throw new Error('FAILED: Low ATS score was not blocked.');
  }

  // Test 2B: Duplicate Job Application Block
  console.log('🧪 Test 2B: Evaluating Duplicate Job Application Gate...');
  const duplicateUrl = 'https://careers.techcorp.com/jobs/senior-fullstack-123';
  // Simulate previous application registration
  const firstCheck = await DuplicateCheckGate.evaluate('user_test', 'job_dup_1', duplicateUrl);
  const secondCheck = await DuplicateCheckGate.evaluate('user_test', 'job_dup_1', duplicateUrl);
  console.log(`   - Initial Application Allowed: ${firstCheck.passed}`);
  console.log(`   - Duplicate Re-Application Allowed: ${secondCheck.passed}`);
  if (firstCheck.passed && !secondCheck.passed) {
    console.log('   ✅ PASSED: Duplicate Application correctly BLOCKED by DuplicateCheckGate.\n');
  } else {
    throw new Error('FAILED: Duplicate check failed to block re-application.');
  }

  // Test 2C: High Risk Captcha/Security Gate Triggering Human Review
  console.log('🧪 Test 2C: Evaluating High Risk / Captcha Boundary Gate...');
  const highRiskGate = RiskScoreGate.evaluate(0.40, true); // Low confidence (0.40), Captcha required (true)
  console.log(`   - Gate Passed: ${highRiskGate.passed}`);
  console.log(`   - Risk Rationale: "${highRiskGate.reason}"`);
  
  const policyOutcomeRisk = PolicyEngine.evaluatePolicyRules('AUTOMATIC', [highRiskGate], 95, 95);
  console.log(`   - Auto Submit Allowed: ${policyOutcomeRisk.shouldAutoSubmit}`);
  console.log(`   - Requires User Approval: ${policyOutcomeRisk.requiresUserApproval}`);
  console.log(`   - Action State: ${policyOutcomeRisk.nextState}`);

  if (policyOutcomeRisk.requiresUserApproval && policyOutcomeRisk.nextState === 'Review') {
    console.log('   ✅ PASSED: High Risk application successfully routed to Human Approval Center.\n');
  } else {
    throw new Error('FAILED: High risk application was not routed to human approval.');
  }

  // Test 2D: Assisted Policy Mode Gate
  console.log('🧪 Test 2D: Evaluating ASSISTED Policy Mode...');
  const assistedOutcome = PolicyEngine.evaluatePolicyRules('ASSISTED', [lowAtsGate], 95, 95);
  console.log(`   - Policy Mode: ASSISTED`);
  console.log(`   - Auto Submit Allowed: ${assistedOutcome.shouldAutoSubmit}`);
  console.log(`   - Requires User Sign-Off: ${assistedOutcome.requiresUserApproval}`);
  if (!assistedOutcome.shouldAutoSubmit && assistedOutcome.requiresUserApproval) {
    console.log('   ✅ PASSED: ASSISTED policy mode correctly requires user approval.\n');
  } else {
    throw new Error('FAILED: ASSISTED mode allowed automatic submission.');
  }

  console.log('================================================================');
  console.log('  🎉 ALL GOLDEN PATH E2E & FAILURE BOUNDARY TESTS PASSED!');
  console.log('================================================================');
}

runGoldenPathE2EVerification().catch(err => {
  console.error('❌ E2E Test Suite Error:', err);
  process.exit(1);
});
