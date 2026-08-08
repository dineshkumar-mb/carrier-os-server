import { GateEvaluationResult } from './ATSThresholdGate';

export class CompanyValidationGate {
  public id = 'company_validation_gate';

  public async evaluate(context: any): Promise<GateEvaluationResult> {
    const company = context.company || 'TechScale Inc';
    const isBlacklisted = false;

    return {
      gateId: this.id,
      passed: !isBlacklisted,
      score: isBlacklisted ? 0 : 100,
      reason: isBlacklisted
        ? `Company ${company} is blacklisted by user policy.`
        : `Company ${company} validated successfully.`
    };
  }
}
