import { EvidenceItem, RiskSignal, VerificationStatus, FreshnessStatus } from './JobVerificationTypes';

export interface DeterministicScoreOutput {
  evidenceScore: number;
  totalRiskPenalty: number;
  authenticityScore: number;
  confidence: number;
  status: VerificationStatus;
  reasons: string[];
}

export class DeterministicScoreEngine {
  private static instance: DeterministicScoreEngine;

  private constructor() {}

  public static getInstance(): DeterministicScoreEngine {
    if (!DeterministicScoreEngine.instance) {
      DeterministicScoreEngine.instance = new DeterministicScoreEngine();
    }
    return DeterministicScoreEngine.instance;
  }

  public calculateScore(
    evidence: EvidenceItem[],
    riskSignals: RiskSignal[],
    freshnessStatus: FreshnessStatus,
    isDuplicate: boolean = false
  ): DeterministicScoreOutput {
    let evidenceScore = 0;
    const reasons: string[] = [];

    // Base score for valid record and job URL
    evidenceScore += 35;

    const seenTypes = new Set<string>();

    for (const item of evidence) {
      if (seenTypes.has(item.type)) continue;
      seenTypes.add(item.type);

      switch (item.type) {
        case 'OFFICIAL_COMPANY_CAREERS':
          evidenceScore += 30;
          reasons.push('Verified on official company careers portal');
          break;
        case 'OFFICIAL_COMPANY_DOMAIN':
          evidenceScore += 20;
          reasons.push('Application domain matches company domain');
          break;
        case 'ATS_LISTING':
        case 'REQUISITION_MATCH':
          evidenceScore += 20;
          reasons.push('Listing and requisition ID verified on official ATS platform');
          break;
        case 'JOB_URL_VALID':
          evidenceScore += 10;
          reasons.push('Valid job application URL verified');
          break;
        case 'FRESH_LISTING':
          evidenceScore += 10;
          reasons.push('Listing is recently posted/active');
          break;
        case 'CROSS_SOURCE_MATCH':
          evidenceScore += 5;
          reasons.push('Confirmed across independent sources');
          break;
        case 'COMPANY_IDENTITY':
          evidenceScore += 5;
          reasons.push('Company identity and recruiter email consistent');
          break;
      }
    }

    // Risk penalties
    let totalRiskPenalty = 0;
    for (const risk of riskSignals) {
      totalRiskPenalty += risk.penalty;
      reasons.push(`Risk Penalty (-${risk.penalty}): ${risk.description}`);
    }

    if (freshnessStatus === 'STALE') {
      totalRiskPenalty += 15;
      reasons.push('Risk Penalty (-15): Listing is stale');
    }

    // Final authenticity score calculation
    const rawScore = evidenceScore - totalRiskPenalty;
    const authenticityScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Confidence calculation (0.0 to 1.0)
    let confidence = 0.5;
    if (seenTypes.has('OFFICIAL_COMPANY_CAREERS') || seenTypes.has('ATS_LISTING')) {
      confidence += 0.35;
    }
    if (seenTypes.has('OFFICIAL_COMPANY_DOMAIN')) {
      confidence += 0.1;
    }
    if (riskSignals.length === 0) {
      confidence += 0.05;
    }
    confidence = Math.min(0.99, Math.max(0.1, Number(confidence.toFixed(2))));

    // Determine status
    let status: VerificationStatus;

    if (isDuplicate) {
      status = 'DUPLICATE';
    } else if (freshnessStatus === 'EXPIRED' || freshnessStatus === 'CLOSED') {
      status = 'EXPIRED';
    } else if (authenticityScore >= 90) {
      status = 'VERIFIED_HIGH_CONFIDENCE';
    } else if (authenticityScore >= 75) {
      status = 'PROBABLY_REAL';
    } else if (authenticityScore >= 50) {
      status = 'NEEDS_REVIEW';
    } else if (authenticityScore >= 25) {
      status = 'SUSPICIOUS';
    } else {
      status = 'INVALID';
    }

    return {
      evidenceScore,
      totalRiskPenalty,
      authenticityScore,
      confidence,
      status,
      reasons
    };
  }
}
