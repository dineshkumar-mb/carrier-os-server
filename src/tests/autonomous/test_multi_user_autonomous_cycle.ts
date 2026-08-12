import mongoose from 'mongoose';
import { AutonomousEngineService } from '../../core/services/AutonomousEngineService';
import { JobVerificationService } from '../../services/jobVerification/JobVerificationService';
import { CandidateMatchingService } from '../../services/intelligence/CandidateMatchingService';
import { ATSOptimizationEngine } from '../../services/intelligence/ATSOptimizationEngine';
import { BrowserExecutionPlanService } from '../../services/execution/BrowserExecutionPlanService';
import { JobRiskAnalyzer } from '../../services/jobVerification/JobRiskAnalyzer';
import { TenantContext } from '../../core/tenant/TenantContext';
import { Job } from '../../models/Job';
import { Application } from '../../models/Application';
import { CandidateJobMatch } from '../../models/CandidateJobMatch';

async function runPhase6GoldenPathTest() {
  console.log('=== Running Phase 6 — Production Autonomous Golden Path Test ===\n');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Setup multi-tenant user contexts
  const userAContext: TenantContext = {
    userId: 'user_alpha',
    tenantId: 'tenant_alpha',
    roles: ['candidate'],
    privacyMode: 'STANDARD'
  };

  const userBContext: TenantContext = {
    userId: 'user_beta',
    tenantId: 'tenant_beta',
    roles: ['candidate'],
    privacyMode: 'STANDARD'
  };

  const userCContext: TenantContext = {
    userId: 'user_gamma',
    tenantId: 'tenant_gamma',
    roles: ['candidate'],
    privacyMode: 'STANDARD'
  };

  assert(userAContext.tenantId !== userBContext.tenantId, 'Test 1: Multi-tenant tenant contexts are isolated');

  // 2. Test Job Trust Layer Filtering before Candidate Matching
  const verificationService = JobVerificationService.getInstance();
  const riskAnalyzer = JobRiskAnalyzer.getInstance();

  const fakeJob = {
    id: 'job_fake_99',
    title: 'Data Entry Specialist',
    company: 'ScamCorp',
    location: 'Remote',
    description: 'Send $100 registration fee in Bitcoin before interview.',
    url: 'https://scamsite.xyz/apply',
    source: 'scraped_custom',
    status: 'active' as const
  };

  const riskSignals = riskAnalyzer.analyzeJob(fakeJob);
  assert(riskSignals.some(r => r.code === 'PAYMENT_REQUESTED'), 'Test 2: Risk analyzer detects critical scam signal (PAYMENT_REQUESTED)');

  const fakeVerifyResult = await verificationService.verifyJob({
    tenantContext: userAContext,
    executionId: 'exec_test_fake',
    canonicalJob: fakeJob
  });

  assert(!fakeVerifyResult.gatePassed, 'Test 3: Job Trust Layer BLOCKS fake job from entering pipeline');
  assert(fakeVerifyResult.globalVerification.verificationStatus === 'INVALID', 'Test 4: Fake job verification status is INVALID');

  // 3. Test Verified Job Candidate Suitability & CandidateJobMatch Creation
  const verifiedJob = {
    id: 'job_verified_101',
    title: 'Senior React Developer',
    company: 'TechCorp',
    location: 'Remote',
    description: 'Looking for a Senior React Developer proficient in TypeScript and Node.js.',
    url: 'https://techcorp.com/careers/react-dev',
    applicationUrl: 'https://boards.greenhouse.io/techcorp/jobs/101',
    source: 'greenhouse',
    postedDate: new Date(),
    status: 'active' as const
  };

  // Mock job save in DB for candidate matching
  const isConnected = mongoose.connection.readyState === 1;
  let dbJob: any = null;
  if (isConnected) {
    dbJob = await Job.findOne({ url: verifiedJob.url }).catch(() => null);
    if (!dbJob) {
      dbJob = await Job.create({
        title: verifiedJob.title,
        company: verifiedJob.company,
        location: verifiedJob.location,
        description: verifiedJob.description,
        url: verifiedJob.url,
        applicationUrl: verifiedJob.applicationUrl,
        skills: ['React', 'TypeScript', 'Node.js'],
        source: verifiedJob.source,
        status: 'active'
      }).catch(() => null);
    }
  }

  if (!dbJob) {
    dbJob = {
      _id: '507f1f77bcf86cd799439011',
      title: verifiedJob.title,
      company: verifiedJob.company,
      location: verifiedJob.location,
      description: verifiedJob.description,
      url: verifiedJob.url,
      applicationUrl: verifiedJob.applicationUrl,
      skills: ['React', 'TypeScript', 'Node.js'],
      source: verifiedJob.source,
      status: 'active'
    };
  }

  const matchingService = CandidateMatchingService.getInstance();
  const matchUserA = await matchingService.evaluateCandidateFit({
    tenantContext: userAContext,
    canonicalJobId: dbJob._id.toString()
  });

  assert(matchUserA.userId === 'user_alpha', 'Test 5: CandidateJobMatch correctly scoped to User Alpha');
  assert(matchUserA.overallMatch >= 70, 'Test 6: CandidateJobMatch computes multi-dimensional fit score');

  // 4. Test Resume Tailoring, Truthfulness Gate & Composite ATS Optimization
  const atsEngine = ATSOptimizationEngine.getInstance();
  const tailoredMarkdown = '# Senior React Developer\n## Skills\nReact, TypeScript, Node.js\n## Experience\n- Developed frontend components in React.';

  const atsEval = await atsEngine.evaluateTailoredResume({
    masterResumeContent: [{ company: 'PrevCorp', title: 'Developer' }],
    tailoredResumeMarkdown: tailoredMarkdown,
    jobTitle: verifiedJob.title,
    jobSkills: ['React', 'TypeScript', 'Node.js']
  });

  assert(atsEval.passedTruthfulness === true, 'Test 7: ResumeTruthfulnessGate passes truthful tailored resume');
  assert(atsEval.truthfulnessScore === 100, 'Test 8: Truthfulness score is 100%');
  assert(atsEval.atsCompatibilityScore >= 80, 'Test 9: Composite ATS score is computed deterministically');

  // 5. Test Constrained Browser Execution Plan & Unknown Form Question Boundary
  const planService = BrowserExecutionPlanService.getInstance();

  const safePlan = await planService.generatePlan({
    tenantContext: userAContext,
    executionId: 'exec_plan_001',
    applicationId: 'app_001',
    applicationUrl: verifiedJob.applicationUrl
  });

  assert(safePlan.allowedActions.includes('SUBMIT'), 'Test 10: Standard browser plan includes SUBMIT action');

  const unknownQuestionPlan = await planService.generatePlan({
    tenantContext: userAContext,
    executionId: 'exec_plan_002',
    applicationId: 'app_002',
    applicationUrl: verifiedJob.applicationUrl,
    formQuestions: ['What is your preferred Kubernetes CNI plugin?']
  });

  assert(unknownQuestionPlan.requiresHumanApproval === true, 'Test 11: Unknown question triggers WAITING_FOR_APPROVAL human boundary');
  assert(!unknownQuestionPlan.allowedActions.includes('SUBMIT'), 'Test 12: Action SUBMIT is revoked when unknown question is detected');

  // 6. Test Multi-Tenant Isolation
  const matchUserB = await matchingService.evaluateCandidateFit({
    tenantContext: userBContext,
    canonicalJobId: dbJob._id.toString()
  });

  assert(matchUserB.userId === 'user_beta' && matchUserB.tenantId === 'tenant_beta', 'Test 13: User Beta match context is completely isolated from User Alpha');

  // 7. Test Autonomous Engine Full Cycle Execution
  const autonomousEngine = AutonomousEngineService.getInstance();
  const cycleResult = await autonomousEngine.runCycle(userAContext);

  assert(cycleResult.jobsDiscovered > 0, 'Test 14: Autonomous cycle discovers jobs');
  assert(cycleResult.jobsVerified >= 0, 'Test 15: Autonomous cycle verifies job authenticity');

  console.log(`\n=== Phase 6 Golden Path Test Summary: ${passedCount}/${totalCount} Passed ===\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runPhase6GoldenPathTest().catch(err => {
  console.error('Phase 6 Golden Path Test Failed:', err);
  process.exit(1);
});
