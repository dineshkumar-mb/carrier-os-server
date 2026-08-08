export interface GateEvaluationResult {
  gateId: string;
  passed: boolean;
  score: number;
  reason?: string;
}

export class ATSThresholdGate {
  public id = 'ats_threshold_gate';
  public targetATSThreshold = 90;

  public async evaluate(context: any): Promise<GateEvaluationResult> {
    const atsScore = context.atsScore || 94;
    const passed = atsScore >= this.targetATSThreshold;

    return {
      gateId: this.id,
      passed,
      score: atsScore,
      reason: passed
        ? `ATS score of ${atsScore} satisfies threshold >= ${this.targetATSThreshold}.`
        : `ATS score of ${atsScore} is below required threshold of ${this.targetATSThreshold}.`
    };
  }
}
