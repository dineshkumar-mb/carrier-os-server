import { GateEvaluationResult } from './ATSThresholdGate';

export class UserApprovalGate {
  public id = 'user_approval_gate';

  public async evaluate(context: any): Promise<GateEvaluationResult> {
    const policyMode = context.policyMode || 'Assisted';

    if (policyMode === 'Automatic') {
      return {
        gateId: this.id,
        passed: true,
        score: 100,
        reason: 'Policy mode is Automatic; bypassing explicit human sign-off.'
      };
    }

    const isUserApproved = context.isUserApproved || false;

    return {
      gateId: this.id,
      passed: isUserApproved,
      score: isUserApproved ? 100 : 0,
      reason: isUserApproved
        ? 'Application explicitly approved in Human Approval Center.'
        : `Policy mode is '${policyMode}'. Application placed in Human Approval Queue awaiting sign-off.`
    };
  }
}
