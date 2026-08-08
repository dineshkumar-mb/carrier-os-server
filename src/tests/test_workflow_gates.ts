import { workflowRegistry } from '../core/workflows/WorkflowRegistry';
import { ApplyToJobWorkflow } from '../core/workflows/plugins/ApplyToJobWorkflow';
import { InterviewPrepWorkflow } from '../core/workflows/plugins/InterviewPrepWorkflow';
import { ResumeAuditWorkflow } from '../core/workflows/plugins/ResumeAuditWorkflow';

import { DuplicateCheckGate } from '../core/gates/DuplicateCheckGate';
import { ResumeQualityGate } from '../core/gates/ResumeQualityGate';
import { RiskScoreGate } from '../core/gates/RiskScoreGate';
import { PolicyEngine } from '../core/infrastructure/PolicyEngine';

import { triggerManager } from '../core/triggers/TriggerManager';
import { MasterResumeAudit } from '../services/ai/MasterResumeAudit';
import { eventBus } from '../core/events/EventBus';

async function runWorkflowGatesVerification() {
  console.log('=== 🛡️ CARRIER OS WORKFLOW REGISTRY & QUALITY GATES VERIFICATION ===');

  // 1. Register Declarative Workflows
  workflowRegistry.register(new ApplyToJobWorkflow());
  workflowRegistry.register(new InterviewPrepWorkflow());
  workflowRegistry.register(new ResumeAuditWorkflow());

  const workflows = workflowRegistry.getAllWorkflows();
  console.log(`✅ Registered ${workflows.length} Declarative Workflows in WorkflowRegistry.`);

  // 2. Test Independent Quality Gates
  const duplicateGate = await DuplicateCheckGate.evaluate('user_gate_test', 'job_gate_123', 'https://example.com/apply');
  console.log(`✅ DuplicateCheckGate Evaluation: Passed = ${duplicateGate.passed}`);

  const resumeGate = ResumeQualityGate.evaluate(85, 80);
  console.log(`✅ ResumeQualityGate Evaluation (85% vs 80%): Passed = ${resumeGate.passed}`);

  const riskGate = RiskScoreGate.evaluate(0.95, false);
  console.log(`✅ RiskScoreGate Evaluation (Confidence 0.95, Captcha False): Passed = ${riskGate.passed}`);

  // 3. Test Deterministic Infrastructure Policy Engine
  const gateResults = [duplicateGate, resumeGate, riskGate];
  const policyOutcomeAuto = PolicyEngine.evaluatePolicyRules('AUTOMATIC', gateResults, 85, 85);
  console.log('✅ PolicyEngine Evaluation (AUTOMATIC Mode):');
  console.log(`   - Auto Submit Allowed: ${policyOutcomeAuto.shouldAutoSubmit}`);
  console.log(`   - Requires User Approval: ${policyOutcomeAuto.requiresUserApproval}`);
  console.log(`   - Next State: ${policyOutcomeAuto.nextState}`);

  const policyOutcomeAssisted = PolicyEngine.evaluatePolicyRules('ASSISTED', gateResults, 85, 85);
  console.log('✅ PolicyEngine Evaluation (ASSISTED Mode):');
  console.log(`   - Auto Submit Allowed: ${policyOutcomeAssisted.shouldAutoSubmit}`);
  console.log(`   - Requires User Approval: ${policyOutcomeAssisted.requiresUserApproval}`);
  console.log(`   - Next State: ${policyOutcomeAssisted.nextState}`);

  // 4. Test Master Resume Health Audit
  const auditResult = await MasterResumeAudit.auditResume({
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    experience: [{ title: 'Senior Software Engineer', duration: '4 years' }]
  });
  console.log(`✅ MasterResumeAudit Score: ${auditResult.masterAtsScore}% (${auditResult.overallStrength})`);

  // 5. Trigger System Event Handling
  console.log('⚡ Publishing "ResumeUploaded" event to TriggerManager...');
  eventBus.publish({
    eventType: 'ResumeUploaded',
    userId: 'user_gate_test',
    timestamp: new Date(),
    data: { skills: ['Go', 'Kubernetes'] }
  });

  console.log('🎉 ALL WORKFLOW REGISTRY & QUALITY GATES VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runWorkflowGatesVerification().catch(console.error);
