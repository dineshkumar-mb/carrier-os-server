export type ApplicationPolicyMode = 'MANUAL' | 'ASSISTED' | 'AUTOMATIC';

export interface PolicyExecutionDecision {
  mode: ApplicationPolicyMode;
  shouldAutoSubmit: boolean;
  requiresUserAction: boolean;
  nextState: 'Review' | 'Queued' | 'Applying';
  reason: string;
}

export class PolicyEngine {
  public static evaluatePolicy(mode: ApplicationPolicyMode, atsScore: number, matchScore: number): PolicyExecutionDecision {
    console.log(`[PolicyEngine] ⚖️ Evaluating submission policy for mode: ${mode} (ATS: ${atsScore}%, Match: ${matchScore}%)`);

    if (mode === 'MANUAL') {
      return {
        mode,
        shouldAutoSubmit: false,
        requiresUserAction: true,
        nextState: 'Review',
        reason: 'Manual policy active. Documents prepared. Waiting for manual user submission.'
      };
    }

    if (mode === 'ASSISTED') {
      return {
        mode,
        shouldAutoSubmit: false,
        requiresUserAction: true,
        nextState: 'Review',
        reason: 'Assisted policy active. Documents prepared and validated. 1-click submit ready for candidate approval.'
      };
    }

    // AUTOMATIC policy mode: requires ATS >= 80% and Match >= 60%
    if (atsScore >= 80 && matchScore >= 60) {
      return {
        mode,
        shouldAutoSubmit: true,
        requiresUserAction: false,
        nextState: 'Queued',
        reason: 'Automatic policy active and Re-Validation Gate passed (ATS >= 80%). Submitting via Playwright worker.'
      };
    }

    return {
      mode,
      shouldAutoSubmit: false,
      requiresUserAction: true,
      nextState: 'Review',
      reason: `Automatic policy active but ATS score (${atsScore}%) is below 80% threshold. Flagged for review.`
    };
  }
}
