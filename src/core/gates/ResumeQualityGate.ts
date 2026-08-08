import { GateResult } from '../infrastructure/PolicyEngine';

export class ResumeQualityGate {
  public static evaluate(atsScore: number, minThreshold: number = 80): GateResult {
    console.log(`[ResumeQualityGate] 🎯 Evaluating ATS Score: ${atsScore}% vs Threshold: ${minThreshold}%`);

    if (atsScore >= minThreshold) {
      return {
        gateId: 'gate_resume_ats',
        passed: true,
        reason: `ATS Score (${atsScore}%) meets or exceeds minimum quality threshold (${minThreshold}%).`,
        retry: false
      };
    }

    return {
      gateId: 'gate_resume_ats',
      passed: false,
      reason: `ATS Score (${atsScore}%) is below minimum quality threshold (${minThreshold}%).`,
      recommendation: 'Regenerate tailored resume or flag for candidate review.',
      retry: true
    };
  }
}
