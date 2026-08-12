export interface PortalSubmissionInput {
  applicationId: string;
  applicationUrl: string;
  candidateProfile: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedInUrl?: string;
    gitHubUrl?: string;
    customAnswersMap?: Record<string, string>;
  };
  resumePdfPath?: string;
  coverLetterPdfPath?: string;
}

export interface PortalSubmissionResult {
  success: boolean;
  portalId: string;
  confirmationText?: string;
  confirmationScreenshotPath?: string;
  executionTrace: string[];
  error?: string;
}

export interface IPortalAdapter {
  portalId: string;
  name: string;
  detectPortal(url: string): boolean;
  executeSubmission(page: any, input: PortalSubmissionInput): Promise<PortalSubmissionResult>;
}
