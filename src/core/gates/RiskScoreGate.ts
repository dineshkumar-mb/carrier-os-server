import { GateResult } from '../infrastructure/PolicyEngine';

export class RiskScoreGate {
  public static evaluate(formConfidence: number, hasCaptcha: boolean = false, maxRiskScore: number = 40): GateResult {
    console.log(`[RiskScoreGate] ⚠️ Evaluating Form Risk (Confidence: ${formConfidence}, Captcha: ${hasCaptcha})`);

    let riskScore = 0;
    if (formConfidence < 0.7) riskScore += 30;
    if (hasCaptcha) riskScore += 50;

    if (riskScore <= maxRiskScore) {
      return {
        gateId: 'gate_risk_score',
        passed: true,
        reason: `Application Form Risk Score (${riskScore}) is within safe threshold (${maxRiskScore}).`,
        retry: false
      };
    }

    return {
      gateId: 'gate_risk_score',
      passed: false,
      reason: `High Form Risk Score (${riskScore} > ${maxRiskScore}). ${hasCaptcha ? 'Captcha detected.' : 'Low input mapping confidence.'}`,
      recommendation: 'Require candidate manual/assisted approval before submitting.',
      retry: false
    };
  }
}
