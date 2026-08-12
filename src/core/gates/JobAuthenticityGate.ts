import { GateEvaluationResult } from './ATSThresholdGate';
import { VerificationStatus, RiskSignal } from '../../services/jobVerification/JobVerificationTypes';

export class JobAuthenticityGate {
  public id = 'job_authenticity_gate';
  public minScoreThreshold = 75;

  public async evaluate(context: {
    authenticityScore?: number;
    verificationStatus?: VerificationStatus;
    riskSignals?: RiskSignal[];
    freshnessStatus?: string;
    isDuplicate?: boolean;
    urlVerified?: boolean;
    userApproved?: boolean;
  }): Promise<GateEvaluationResult> {
    const score = context.authenticityScore ?? 0;
    const status = context.verificationStatus || 'INVALID';
    const riskSignals = context.riskSignals || [];
    const isExpired = context.freshnessStatus === 'EXPIRED' || context.freshnessStatus === 'CLOSED';
    const hasCriticalRisk = riskSignals.some(r => r.severity === 'CRITICAL');

    if (context.userApproved) {
      return {
        gateId: this.id,
        passed: true,
        score: Math.max(score, 80),
        reason: '[JobAuthenticityGate PASSED] Manually approved by user.'
      };
    }

    if (isExpired) {
      return {
        gateId: this.id,
        passed: false,
        score: 0,
        reason: '[JobAuthenticityGate BLOCKED] Job listing is EXPIRED or CLOSED.'
      };
    }

    if (context.isDuplicate) {
      return {
        gateId: this.id,
        passed: false,
        score: 0,
        reason: '[JobAuthenticityGate BLOCKED] Duplicate job listing detected.'
      };
    }

    if (hasCriticalRisk) {
      const critical = riskSignals.find(r => r.severity === 'CRITICAL');
      return {
        gateId: this.id,
        passed: false,
        score: 0,
        reason: `[JobAuthenticityGate BLOCKED] Critical risk detected: ${critical?.description || 'Severe scam indicator'}`
      };
    }

    if (status === 'VERIFIED_HIGH_CONFIDENCE' || status === 'PROBABLY_REAL') {
      return {
        gateId: this.id,
        passed: true,
        score,
        reason: `[JobAuthenticityGate PASSED] Job verified with status '${status}' and score ${score}/100.`
      };
    }

    if (status === 'NEEDS_REVIEW') {
      return {
        gateId: this.id,
        passed: false,
        score,
        reason: `[JobAuthenticityGate REVIEW_REQUIRED] Job requires human review before application (score: ${score}/100).`
      };
    }

    return {
      gateId: this.id,
      passed: false,
      score,
      reason: `[JobAuthenticityGate BLOCKED] Job verification failed with status '${status}' and score ${score}/100.`
    };
  }
}
