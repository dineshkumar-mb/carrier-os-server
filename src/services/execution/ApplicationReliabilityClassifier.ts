export type ApplicationPrimaryResult = 'SUCCESS' | 'PARTIAL' | 'BLOCKED' | 'FAILED';

export type ApplicationSubStatus =
  // SUCCESS
  | 'SUBMITTED'
  | 'CONFIRMATION_RECEIVED'
  | 'EVIDENCE_CAPTURED'
  // PARTIAL
  | 'FORM_FILLED'
  | 'UPLOAD_COMPLETED'
  | 'SUBMISSION_UNCONFIRMED'
  // BLOCKED
  | 'CAPTCHA'
  | 'UNKNOWN_QUESTION'
  | 'LOGIN_REQUIRED'
  | 'CONSENT_REQUIRED'
  | 'POLICY_BLOCK'
  // FAILED
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PORTAL_ERROR'
  | 'BROWSER_ERROR';

export interface ApplicationReliabilityOutcome {
  primaryResult: ApplicationPrimaryResult;
  subStatus: ApplicationSubStatus;
  userFacingExplanation: string;
  actionRequired?: string;
  isRetryable: boolean;
}

export class ApplicationReliabilityClassifier {
  private static instance: ApplicationReliabilityClassifier;

  private constructor() {}

  public static getInstance(): ApplicationReliabilityClassifier {
    if (!ApplicationReliabilityClassifier.instance) {
      ApplicationReliabilityClassifier.instance = new ApplicationReliabilityClassifier();
    }
    return ApplicationReliabilityClassifier.instance;
  }

  public classifyOutcome(params: {
    status: string;
    hasConfirmationText?: boolean;
    hasScreenshot?: boolean;
    unknownQuestionDetected?: boolean;
    captchaDetected?: boolean;
    loginRequired?: boolean;
    errorMsg?: string;
  }): ApplicationReliabilityOutcome {
    const { status, hasConfirmationText, hasScreenshot, unknownQuestionDetected, captchaDetected, loginRequired, errorMsg } = params;

    // 1. BLOCKED Cases
    if (captchaDetected) {
      return {
        primaryResult: 'BLOCKED',
        subStatus: 'CAPTCHA',
        userFacingExplanation: 'Submission paused: Employer site requires CAPTCHA verification.',
        actionRequired: 'Manual CAPTCHA completion required in browser session.',
        isRetryable: true
      };
    }

    if (unknownQuestionDetected) {
      return {
        primaryResult: 'BLOCKED',
        subStatus: 'UNKNOWN_QUESTION',
        userFacingExplanation: 'Submission paused: Non-standard application question detected without candidate profile answer.',
        actionRequired: 'Provide answer in Human Approval Center.',
        isRetryable: true
      };
    }

    if (loginRequired) {
      return {
        primaryResult: 'BLOCKED',
        subStatus: 'LOGIN_REQUIRED',
        userFacingExplanation: 'Submission paused: Portal requires applicant account login.',
        actionRequired: 'Authenticate with portal credentials.',
        isRetryable: true
      };
    }

    // 2. SUCCESS Cases
    if (status === 'APPLIED' || hasConfirmationText) {
      const subStatus: ApplicationSubStatus = hasScreenshot
        ? 'EVIDENCE_CAPTURED'
        : (hasConfirmationText ? 'CONFIRMATION_RECEIVED' : 'SUBMITTED');

      return {
        primaryResult: 'SUCCESS',
        subStatus,
        userFacingExplanation: 'Application submitted successfully with confirmation evidence.',
        isRetryable: false
      };
    }

    // 3. FAILED Cases
    if (errorMsg) {
      const errLower = errorMsg.toLowerCase();
      let subStatus: ApplicationSubStatus = 'BROWSER_ERROR';
      if (errLower.includes('timeout')) subStatus = 'TIMEOUT';
      else if (errLower.includes('net::') || errLower.includes('network')) subStatus = 'NETWORK_ERROR';
      else if (errLower.includes('500') || errLower.includes('server')) subStatus = 'PORTAL_ERROR';

      return {
        primaryResult: 'FAILED',
        subStatus,
        userFacingExplanation: `Submission failed: ${errorMsg}`,
        isRetryable: true
      };
    }

    // 4. PARTIAL Fallback
    return {
      primaryResult: 'PARTIAL',
      subStatus: 'FORM_FILLED',
      userFacingExplanation: 'Form fields auto-filled but submission confirmation pending.',
      isRetryable: true
    };
  }
}
