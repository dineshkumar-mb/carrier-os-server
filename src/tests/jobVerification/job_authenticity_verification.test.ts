import { DeterministicScoreEngine } from '../../services/jobVerification/DeterministicScoreEngine';
import { JobRiskAnalyzer } from '../../services/jobVerification/JobRiskAnalyzer';
import { CompanyVerificationService } from '../../services/jobVerification/CompanyVerificationService';
import { JobEvidenceService } from '../../services/jobVerification/JobEvidenceService';
import { JobVerificationAgent } from '../../core/agents/plugins/JobVerificationAgent';
import { JobAuthenticityGate } from '../../core/gates/JobAuthenticityGate';
import { EvidenceItem, RiskSignal } from '../../services/jobVerification/JobVerificationTypes';

async function runTests() {
  console.log('=== Running Job Authenticity Verification Test Suite ===\n');
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

  const scoreEngine = DeterministicScoreEngine.getInstance();
  const riskAnalyzer = JobRiskAnalyzer.getInstance();
  const companyService = CompanyVerificationService.getInstance();
  const agent = new JobVerificationAgent();
  const gate = new JobAuthenticityGate();

  // Test 1: Official company careers page exists -> high confidence
  {
    const evidence: EvidenceItem[] = [
      {
        id: 'ev1',
        type: 'OFFICIAL_COMPANY_CAREERS',
        strength: 'STRONG',
        provenance: 'OFFICIAL',
        sourceUrl: 'https://acme.com/careers/software-engineer',
        observedAt: new Date(),
        details: 'Verified official company careers listing'
      },
      {
        id: 'ev2',
        type: 'OFFICIAL_COMPANY_DOMAIN',
        strength: 'STRONG',
        provenance: 'OFFICIAL',
        sourceUrl: 'https://acme.com/careers/software-engineer',
        observedAt: new Date(),
        details: 'Application domain matches official company domain'
      },
      {
        id: 'ev3',
        type: 'ATS_LISTING',
        strength: 'STRONG',
        provenance: 'OFFICIAL',
        sourceUrl: 'https://boards.greenhouse.io/acme/jobs/12345',
        observedAt: new Date(),
        details: 'Hosted on official Greenhouse ATS platform'
      }
    ];

    const scoreOut = scoreEngine.calculateScore(evidence, [], 'ACTIVE');
    assert(scoreOut.status === 'VERIFIED_HIGH_CONFIDENCE', 'Test 1: Official careers page & ATS -> VERIFIED_HIGH_CONFIDENCE');
    assert(scoreOut.authenticityScore >= 90, 'Test 1: Score >= 90');
  }

  // Test 2: Official domain matches application domain -> increase score
  {
    const evidence: EvidenceItem[] = [
      {
        id: 'ev_dom',
        type: 'OFFICIAL_COMPANY_DOMAIN',
        strength: 'STRONG',
        provenance: 'OFFICIAL',
        observedAt: new Date(),
        details: 'Domain match'
      }
    ];

    const scoreOut = scoreEngine.calculateScore(evidence, [], 'ACTIVE');
    assert(scoreOut.authenticityScore > 20, 'Test 2: Official domain match increases score');
  }

  // Test 3: Same requisition ID exists on company careers -> strong evidence
  {
    const evidence: EvidenceItem[] = [
      {
        id: 'ev_req',
        type: 'REQUISITION_MATCH',
        strength: 'STRONG',
        provenance: 'OFFICIAL',
        observedAt: new Date(),
        details: 'Requisition REQ-9982 matched on Greenhouse'
      }
    ];

    const scoreOut = scoreEngine.calculateScore(evidence, [], 'ACTIVE');
    assert(scoreOut.reasons.some(r => r.includes('requisition ID')), 'Test 3: Requisition match included in evidence reasons');
  }

  // Test 4: Job is expired -> EXPIRED
  {
    const scoreOut = scoreEngine.calculateScore([], [], 'EXPIRED');
    assert(scoreOut.status === 'EXPIRED', 'Test 4: Expired job -> EXPIRED status');

    const gateEval = await gate.evaluate({ freshnessStatus: 'EXPIRED' });
    assert(!gateEval.passed, 'Test 4: Gate blocks expired job');
  }

  // Test 5: Payment requested -> critical risk / BLOCK
  {
    const risks = riskAnalyzer.analyzeJob({
      title: 'Data Entry Clerk',
      company: 'ScamCo',
      location: 'Remote',
      description: 'Send $50 registration fee via bitcoin before interview.',
      url: 'https://scamsite.com/apply'
    });

    assert(risks.some(r => r.code === 'PAYMENT_REQUESTED'), 'Test 5: Risk analyzer detects PAYMENT_REQUESTED');

    const scoreOut = scoreEngine.calculateScore([], risks, 'ACTIVE');
    assert(scoreOut.authenticityScore === 0, 'Test 5: Critical risk reduces score to 0');

    const gateEval = await gate.evaluate({
      authenticityScore: scoreOut.authenticityScore,
      verificationStatus: scoreOut.status,
      riskSignals: risks
    });

    assert(!gateEval.passed, 'Test 5: Gate BLOCKS job with critical payment risk');
  }

  // Test 6: Application redirects to unrelated domain -> high risk
  {
    const risks = riskAnalyzer.analyzeJob({
      title: 'Senior Engineer',
      company: 'Google',
      location: 'Mountain View',
      description: 'Great role at Google.',
      url: 'https://totally-unrelated-random-scam.xyz/apply'
    });

    assert(risks.some(r => r.code === 'UNRELATED_APPLICATION_DOMAIN'), 'Test 6: Detects UNRELATED_APPLICATION_DOMAIN risk');
  }

  // Test 7: Company cannot be independently verified -> NEEDS_REVIEW (not automatic hard block)
  {
    const companyRes = await companyService.verifyCompanyAndJob({
      canonicalJobId: 'job_startup',
      title: 'Full Stack Engineer',
      company: 'Stealth Startup X',
      location: 'Remote',
      url: 'https://stealthstartupx.io/job/1',
      description: 'Exciting early stage role.',
      source: 'scraped_custom'
    });

    const scoreOut = scoreEngine.calculateScore(companyRes.evidence, companyRes.riskSignals, 'ACTIVE');
    assert(scoreOut.status === 'NEEDS_REVIEW' || scoreOut.status === 'PROBABLY_REAL', 'Test 7: Unverified company results in NEEDS_REVIEW (not automatic hard block)');
  }

  // Test 8: Duplicate job -> DUPLICATE
  {
    const scoreOut = scoreEngine.calculateScore([], [], 'ACTIVE', true);
    assert(scoreOut.status === 'DUPLICATE', 'Test 8: Duplicate flag sets status to DUPLICATE');
  }

  // Test 9: AI says REAL but deterministic gate detects critical risk -> BLOCK
  {
    const criticalRisk: RiskSignal[] = [{
      code: 'PAYMENT_REQUESTED',
      severity: 'CRITICAL',
      description: 'Demands security deposit',
      penalty: 100
    }];

    const gateEval = await gate.evaluate({
      authenticityScore: 95,
      verificationStatus: 'VERIFIED_HIGH_CONFIDENCE',
      riskSignals: criticalRisk
    });

    assert(!gateEval.passed, 'Test 9: Deterministic gate overrides high score and BLOCKS due to critical risk');
  }

  // Test 10: AI agent reasoning synthesis (anti-hallucination constraint)
  {
    const agentRes = await agent.execute({
      userId: 'user_123',
      jobId: 'job_456',
      jobTitle: 'Frontend Engineer',
      company: 'Vercel',
      customParams: {
        evidence: [
          { id: '1', type: 'OFFICIAL_COMPANY_CAREERS', strength: 'STRONG', provenance: 'OFFICIAL', details: 'Confirmed on vercel.com/careers' }
        ],
        riskSignals: [],
        deterministicScore: 92,
        deterministicStatus: 'VERIFIED_HIGH_CONFIDENCE'
      }
    });

    assert(agentRes.score === 92, 'Test 10: Agent inherits deterministic score');
    assert(agentRes.data?.recommendation === 'ALLOW_MATCHING', 'Test 10: Agent recommends ALLOW_MATCHING for high confidence job');
  }

  console.log(`\n=== Job Authenticity Verification Test Summary: ${passedCount}/${totalCount} Passed ===\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
