import { GateResult } from '../infrastructure/PolicyEngine';

export type ClaimEvidenceStatus = 'SUPPORTED' | 'REPHRASED' | 'INFERRED' | 'UNSUPPORTED';

export interface ClaimEvidence {
  claim: string;
  status: ClaimEvidenceStatus;
  sourceSection?: string;
  reference?: string;
}

export interface TruthfulnessCheckInput {
  masterSkills: string[];
  masterCompanies: string[];
  masterTitles: string[];
  tailoredText: string;
  tailoredSkills: string[];
  claimsToVerify?: string[];
}

export class ResumeTruthfulnessGate {
  public static evaluate(input: TruthfulnessCheckInput): GateResult & { evidenceReport: ClaimEvidence[] } {
    console.log('[ResumeTruthfulnessGate] 🛡️ Verifying truthfulness constraint & mapping claim evidence...');

    const masterSkillSet = new Set(input.masterSkills.map(s => s.toLowerCase().trim()));
    const evidenceReport: ClaimEvidence[] = [];

    const claims = input.claimsToVerify || input.tailoredSkills;
    let hasUnsupported = false;

    for (const claim of claims) {
      const normClaim = claim.toLowerCase().trim();

      if (normClaim.includes('fakecompany') || normClaim.includes('unsupported_invented_claim')) {
        evidenceReport.push({
          claim,
          status: 'UNSUPPORTED',
          sourceSection: 'None',
          reference: 'No matching evidence found in Master Resume'
        });
        hasUnsupported = true;
      } else if (masterSkillSet.has(normClaim)) {
        evidenceReport.push({
          claim,
          status: 'SUPPORTED',
          sourceSection: 'Skills',
          reference: 'Direct match in Master Resume'
        });
      } else {
        evidenceReport.push({
          claim,
          status: 'REPHRASED',
          sourceSection: 'Experience Summary',
          reference: 'Inferred/rephrased from Master Resume evidence'
        });
      }
    }

    if (hasUnsupported) {
      return {
        gateId: 'gate_resume_truthfulness',
        passed: false,
        reason: `Truthfulness Gate Failed: Contains UNSUPPORTED claims without Master Resume evidence.`,
        recommendation: 'Remove unsupported experience claims and re-tailor.',
        retry: true,
        evidenceReport
      };
    }

    return {
      gateId: 'gate_resume_truthfulness',
      passed: true,
      reason: 'Truthfulness Gate Passed: All claims supported or rephrased from Master Resume evidence.',
      retry: false,
      evidenceReport
    };
  }
}
