import { JobEvidenceService } from './JobEvidenceService';
import { CompanyVerificationService } from './CompanyVerificationService';
import { JobRiskAnalyzer } from './JobRiskAnalyzer';
import { DeterministicScoreEngine } from './DeterministicScoreEngine';
import { JobVerificationRepository } from '../../repositories/JobVerificationRepository';
import { JobVerificationAgent } from '../../core/agents/plugins/JobVerificationAgent';
import { JobAuthenticityGate } from '../../core/gates/JobAuthenticityGate';
import { TenantContext } from '../../core/tenant/TenantContext';
import { SecurityBoundary } from '../../core/security/SecurityBoundary';
import { runtimeEvents } from '../../core/events/RuntimeEventEmitter';
import {
  VerificationResult,
  VerificationStatus,
  VerificationState,
  FreshnessStatus,
  UserVerificationContextResult
} from './JobVerificationTypes';

export interface VerifyJobRequest {
  tenantContext: TenantContext;
  executionId: string;
  canonicalJob: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    applicationUrl?: string;
    source: string;
    postedDate?: Date;
    status?: 'active' | 'closed';
    externalId?: string;
    requisitionId?: string;
    recruiterEmail?: string;
  };
  forceRefresh?: boolean;
}

export class JobVerificationService {
  private static instance: JobVerificationService;
  private evidenceService: JobEvidenceService;
  private companyService: CompanyVerificationService;
  private riskAnalyzer: JobRiskAnalyzer;
  private scoreEngine: DeterministicScoreEngine;
  private repo: JobVerificationRepository;
  private agent: JobVerificationAgent;
  private gate: JobAuthenticityGate;

  private constructor() {
    this.evidenceService = JobEvidenceService.getInstance();
    this.companyService = CompanyVerificationService.getInstance();
    this.riskAnalyzer = JobRiskAnalyzer.getInstance();
    this.scoreEngine = DeterministicScoreEngine.getInstance();
    this.repo = JobVerificationRepository.getInstance();
    this.agent = new JobVerificationAgent();
    this.gate = new JobAuthenticityGate();
  }

  public static getInstance(): JobVerificationService {
    if (!JobVerificationService.instance) {
      JobVerificationService.instance = new JobVerificationService();
    }
    return JobVerificationService.instance;
  }

  public async verifyJob(req: VerifyJobRequest): Promise<{
    globalVerification: VerificationResult;
    userContext: UserVerificationContextResult;
    gatePassed: boolean;
    gateReason: string;
  }> {
    const { tenantContext, executionId, canonicalJob, forceRefresh } = req;

    // 1. Multi-Tenant Security Authorization
    const authResult = SecurityBoundary.getInstance().authorize({
      tenantContext,
      executionId,
      action: 'RESOURCE_ACCESS',
      resourceTarget: `job_verification:${canonicalJob.id}`
    });

    if (!authResult.authorized) {
      throw new Error(`[JobVerificationService Security Denial] ${authResult.reason}`);
    }

    runtimeEvents.emitEvent('JobVerification:Started', {
      executionId,
      details: { jobId: canonicalJob.id, company: canonicalJob.company, title: canonicalJob.title }
    });

    // 2. Basic Job Validation
    if (!canonicalJob.title || !canonicalJob.company || !canonicalJob.url || !canonicalJob.description || !canonicalJob.source) {
      const invalidGlobal: VerificationResult = {
        canonicalJobId: canonicalJob.id || 'unknown',
        fingerprint: 'invalid',
        verificationStatus: 'INVALID',
        verificationState: 'FAILED',
        authenticityScore: 0,
        confidence: 1.0,
        companyVerified: false,
        officialCareerPageFound: false,
        officialDomainVerified: false,
        requisitionVerified: false,
        urlVerified: false,
        crossSourceConfirmed: false,
        freshnessStatus: 'UNKNOWN',
        evidence: [],
        riskSignals: [{ code: 'MALFORMED_JOB_RECORD', severity: 'CRITICAL', description: 'Missing required job fields', penalty: 100 }],
        reasons: ['Malformed record: Missing title, company, URL, description, or source'],
        contentHash: '',
        verifiedAt: new Date(),
        verificationExpiresAt: new Date(),
        verifierVersion: '1.0.0'
      };

      const userCtx = await this.repo.saveUserContext(
        tenantContext,
        executionId,
        canonicalJob.id,
        'invalid',
        invalidGlobal.riskSignals,
        'BLOCK'
      );

      runtimeEvents.emitEvent('JobVerification:Blocked', {
        executionId,
        details: { jobId: canonicalJob.id, reason: 'Malformed job record' }
      });

      return {
        globalVerification: invalidGlobal,
        userContext: {
          tenantId: userCtx.tenantId,
          userId: userCtx.userId,
          executionId: userCtx.executionId,
          canonicalJobId: userCtx.canonicalJobId,
          globalVerificationId: String(userCtx.globalVerificationId),
          userSpecificRiskSignals: userCtx.userSpecificRiskSignals,
          policyDecision: userCtx.policyDecision,
          createdAt: userCtx.createdAt
        },
        gatePassed: false,
        gateReason: 'Malformed job record'
      };
    }

    // 3. Compute Fingerprint and Content Hash
    const fingerprint = this.evidenceService.computeFingerprint(
      canonicalJob.title,
      canonicalJob.company,
      canonicalJob.location,
      canonicalJob.url
    );

    const currentContentHash = this.evidenceService.computeContentHash({
      title: canonicalJob.title,
      company: canonicalJob.company,
      location: canonicalJob.location,
      description: canonicalJob.description,
      url: canonicalJob.url,
      applicationUrl: canonicalJob.applicationUrl,
      requisitionId: canonicalJob.requisitionId
    });

    // Check cached Global Verification if not forceRefresh
    if (!forceRefresh) {
      const existingGlobal = await this.repo.findGlobalVerification(fingerprint);
      if (existingGlobal) {
        const isExpired = new Date() > new Date(existingGlobal.verificationExpiresAt);
        const hasContentChanged = existingGlobal.contentHash !== currentContentHash;

        if (!isExpired && !hasContentChanged) {
          // Cached global verification is valid
          const userCtx = await this.repo.saveUserContext(
            tenantContext,
            executionId,
            canonicalJob.id,
            String(existingGlobal._id),
            [],
            existingGlobal.verificationStatus === 'VERIFIED_HIGH_CONFIDENCE'
              ? 'ALLOW_AUTOMATIC'
              : existingGlobal.verificationStatus === 'PROBABLY_REAL'
              ? 'ALLOW_ASSISTED'
              : existingGlobal.verificationStatus === 'NEEDS_REVIEW'
              ? 'NEEDS_HUMAN_REVIEW'
              : 'BLOCK'
          );

          const gateEval = await this.gate.evaluate({
            authenticityScore: existingGlobal.authenticityScore,
            verificationStatus: existingGlobal.verificationStatus as VerificationStatus,
            riskSignals: existingGlobal.riskSignals,
            freshnessStatus: existingGlobal.freshnessStatus,
            urlVerified: existingGlobal.urlVerified
          });

          return {
            globalVerification: existingGlobal.toObject() as any,
            userContext: {
              tenantId: userCtx.tenantId,
              userId: userCtx.userId,
              executionId: userCtx.executionId,
              canonicalJobId: userCtx.canonicalJobId,
              globalVerificationId: String(userCtx.globalVerificationId),
              userSpecificRiskSignals: userCtx.userSpecificRiskSignals,
              policyDecision: userCtx.policyDecision,
              createdAt: userCtx.createdAt
            },
            gatePassed: gateEval.passed,
            gateReason: gateEval.reason || ''
          };
        }
      }
    }

    // 4. Verification State Progression: VALIDATING -> URL_VERIFIED
    let currentState: VerificationState = 'VALIDATING';

    const urlVerified = canonicalJob.url.startsWith('http://') || canonicalJob.url.startsWith('https://');
    currentState = 'URL_VERIFIED';
    runtimeEvents.emitEvent('JobVerification:URLChecked', { executionId, details: { url: canonicalJob.url, urlVerified } });

    // 5. Company Verification
    const companyRes = await this.companyService.verifyCompanyAndJob({
      canonicalJobId: canonicalJob.id,
      title: canonicalJob.title,
      company: canonicalJob.company,
      location: canonicalJob.location,
      url: canonicalJob.url,
      applicationUrl: canonicalJob.applicationUrl,
      description: canonicalJob.description,
      source: canonicalJob.source,
      externalId: canonicalJob.externalId,
      requisitionId: canonicalJob.requisitionId,
      recruiterEmail: canonicalJob.recruiterEmail
    });

    currentState = 'COMPANY_VERIFIED';
    runtimeEvents.emitEvent('JobVerification:CompanyChecked', {
      executionId,
      details: { company: canonicalJob.company, companyVerified: companyRes.companyVerified }
    });

    // 6. Freshness Verification
    let freshnessStatus: FreshnessStatus = 'ACTIVE';
    if (canonicalJob.status === 'closed') {
      freshnessStatus = 'CLOSED';
    } else if (canonicalJob.postedDate) {
      const daysOld = (Date.now() - new Date(canonicalJob.postedDate).getTime()) / (1000 * 3600 * 24);
      if (daysOld > 90) freshnessStatus = 'EXPIRED';
      else if (daysOld > 45) freshnessStatus = 'STALE';
    }

    currentState = 'FRESHNESS_VERIFIED';
    runtimeEvents.emitEvent('JobVerification:FreshnessChecked', { executionId, details: { freshnessStatus } });

    // 7. Risk Analyzer
    const riskSignals = this.riskAnalyzer.analyzeJob({
      title: canonicalJob.title,
      company: canonicalJob.company,
      location: canonicalJob.location,
      description: canonicalJob.description,
      url: canonicalJob.url,
      applicationUrl: canonicalJob.applicationUrl,
      recruiterEmail: canonicalJob.recruiterEmail
    });

    riskSignals.push(...companyRes.riskSignals);
    currentState = 'RISK_ANALYZED';

    if (riskSignals.length > 0) {
      runtimeEvents.emitEvent('JobVerification:RiskDetected', {
        executionId,
        details: { count: riskSignals.length, codes: riskSignals.map(r => r.code) }
      });
    }

    // 8. Deterministic Score Calculation
    const scoreOut = this.scoreEngine.calculateScore(
      companyRes.evidence,
      riskSignals,
      freshnessStatus
    );

    // 9. AI Verification Agent Synthesis
    const agentResult = await this.agent.execute({
      userId: tenantContext.userId,
      jobId: canonicalJob.id,
      jobTitle: canonicalJob.title,
      company: canonicalJob.company,
      customParams: {
        canonicalJob,
        evidence: companyRes.evidence,
        riskSignals,
        deterministicScore: scoreOut.authenticityScore,
        deterministicStatus: scoreOut.status
      }
    });

    currentState = 'AI_REVIEWED';

    // 10. Authenticity Gate Evaluation
    const gateEval = await this.gate.evaluate({
      authenticityScore: scoreOut.authenticityScore,
      verificationStatus: scoreOut.status,
      riskSignals,
      freshnessStatus,
      urlVerified
    });

    currentState = 'GATE_EVALUATED';

    const verifiedAt = new Date();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours Expiration

    // 11. Save Global Job Verification
    const savedGlobal = await this.repo.saveGlobalVerification({
      canonicalJobId: canonicalJob.id,
      fingerprint,
      verificationStatus: scoreOut.status,
      verificationState: 'COMPLETED',
      authenticityScore: scoreOut.authenticityScore,
      confidence: scoreOut.confidence,
      companyVerified: companyRes.companyVerified,
      officialCareerPageFound: companyRes.officialCareerPageFound,
      officialDomainVerified: companyRes.officialDomainVerified,
      requisitionVerified: companyRes.requisitionVerified,
      urlVerified,
      crossSourceConfirmed: companyRes.evidence.some(e => e.type === 'CROSS_SOURCE_MATCH'),
      freshnessStatus,
      evidence: companyRes.evidence,
      riskSignals,
      reasons: scoreOut.reasons,
      contentHash: currentContentHash,
      verifiedAt,
      verificationExpiresAt,
      verifierVersion: '1.0.0'
    });

    // 12. Save User Context Verification
    let policyDecision: 'ALLOW_AUTOMATIC' | 'ALLOW_ASSISTED' | 'NEEDS_HUMAN_REVIEW' | 'BLOCK' = 'BLOCK';
    if (scoreOut.status === 'VERIFIED_HIGH_CONFIDENCE') policyDecision = 'ALLOW_AUTOMATIC';
    else if (scoreOut.status === 'PROBABLY_REAL') policyDecision = 'ALLOW_ASSISTED';
    else if (scoreOut.status === 'NEEDS_REVIEW') policyDecision = 'NEEDS_HUMAN_REVIEW';

    const userCtx = await this.repo.saveUserContext(
      tenantContext,
      executionId,
      canonicalJob.id,
      String(savedGlobal._id),
      [],
      policyDecision
    );

    runtimeEvents.emitEvent('JobVerification:Completed', {
      executionId,
      details: {
        jobId: canonicalJob.id,
        score: scoreOut.authenticityScore,
        status: scoreOut.status,
        gatePassed: gateEval.passed
      }
    });

    return {
      globalVerification: savedGlobal.toObject() as any,
      userContext: {
        tenantId: userCtx.tenantId,
        userId: userCtx.userId,
        executionId: userCtx.executionId,
        canonicalJobId: userCtx.canonicalJobId,
        globalVerificationId: String(userCtx.globalVerificationId),
        userSpecificRiskSignals: userCtx.userSpecificRiskSignals,
        policyDecision: userCtx.policyDecision,
        createdAt: userCtx.createdAt
      },
      gatePassed: gateEval.passed,
      gateReason: gateEval.reason || ''
    };
  }
}
