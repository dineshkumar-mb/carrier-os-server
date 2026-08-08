import { GateEvaluationResult } from './ATSThresholdGate';

export class PolicyValidationGate {
  public id = 'policy_validation_gate';

  public async evaluate(context: any): Promise<GateEvaluationResult> {
    const salaryTarget = context.userPolicy?.minSalary || 120000;
    const jobSalary = context.jobSalary || 140000;
    const passed = jobSalary >= salaryTarget;

    return {
      gateId: this.id,
      passed,
      score: passed ? 100 : 50,
      reason: passed
        ? `Salary of $${jobSalary} satisfies minimum policy target of $${salaryTarget}.`
        : `Salary of $${jobSalary} is below target minimum of $${salaryTarget}.`
    };
  }
}
