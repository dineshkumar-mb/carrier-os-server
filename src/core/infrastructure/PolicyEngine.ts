export type ApplicationPolicyMode = 'MANUAL' | 'ASSISTED' | 'AUTOMATIC';

export interface GateResult {
  gateId: string;
  passed: boolean;
  reason: string;
  recommendation?: string;
  retry: boolean;
}

export interface PolicyEvaluationOutcome {
  mode: ApplicationPolicyMode;
  shouldAutoSubmit: boolean;
  requiresUserApproval: boolean;
  nextState: 'Review' | 'Queued' | 'Applying';
  failedGates: string[];
  reason: string;
  gateResults: GateResult[];
}

export class PolicyEngine {
  public static evaluatePolicyRules(
    mode: ApplicationPolicyMode,
    gateResults: GateResult[],
    matchScore: number,
    atsScore: number
  ): PolicyEvaluationOutcome {
    console.log(`[PolicyEngine] ⚖️ Infrastructure Policy Evaluation for Mode: ${mode}`);

    const failedGates = gateResults.filter(g => !g.passed).map(g => g.gateId);
    const hasDuplicates = gateResults.some(g => g.gateId === 'gate_duplicate_check' && !g.passed);

    if (hasDuplicates) {
      return {
        mode,
        shouldAutoSubmit: false,
        requiresUserApproval: true,
        nextState: 'Review',
        failedGates,
        reason: 'Duplicate check failed. Candidate has already submitted an application for this position.',
        gateResults
      };
    }

    if (mode === 'MANUAL') {
      return {
        mode,
        shouldAutoSubmit: false,
        requiresUserApproval: true,
        nextState: 'Review',
        failedGates,
        reason: 'Manual policy active. Documents prepared. Candidate manual submission required.',
        gateResults
      };
    }

    if (mode === 'ASSISTED') {
      return {
        mode,
        shouldAutoSubmit: false,
        requiresUserApproval: true,
        nextState: 'Review',
        failedGates,
        reason: 'Assisted policy active. Documents prepared & validated. 1-click submit ready for candidate approval.',
        gateResults
      };
    }

    // AUTOMATIC policy mode: All gates must pass, ATS >= 80, Match >= 60
    if (failedGates.length === 0 && atsScore >= 80 && matchScore >= 60) {
      return {
        mode,
        shouldAutoSubmit: true,
        requiresUserApproval: false,
        nextState: 'Queued',
        failedGates: [],
        reason: 'Automatic policy active and all Quality Gates PASSED. Enqueuing for Playwright auto-submission.',
        gateResults
      };
    }

    return {
      mode,
      shouldAutoSubmit: false,
      requiresUserApproval: true,
      nextState: 'Review',
      failedGates,
      reason: `Automatic policy active but Quality Gate(s) failed [${failedGates.join(', ')}]. Flagged for candidate review.`,
      gateResults
    };
  }
}
