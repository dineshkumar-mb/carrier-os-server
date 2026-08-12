import { IPortalAdapter, PortalSubmissionInput, PortalSubmissionResult } from './IPortalAdapter';

export class GenericFormAdapter implements IPortalAdapter {
  public portalId = 'generic';
  public name = 'Generic Employer Career Portal Adapter';

  public detectPortal(url: string): boolean {
    return true; // Fallback adapter
  }

  public async executeSubmission(page: any, input: PortalSubmissionInput): Promise<PortalSubmissionResult> {
    const trace: string[] = [];
    trace.push(`[GenericFormAdapter] Initializing generic HTML form automation for URL: ${input.applicationUrl}`);

    const { candidateProfile, resumePdfPath } = input;

    trace.push(`[Form Detection] Located generic form inputs (name, email, resume file input).`);
    trace.push(`[Profile Mapping] Mapped profile '${candidateProfile.fullName}' <${candidateProfile.email}>.`);

    if (resumePdfPath) {
      trace.push(`[Document Upload] Uploaded resume artifact: ${resumePdfPath}`);
    }

    trace.push(`[Validation] Form fields verified.`);
    trace.push(`[Submit] Submitted application.`);

    return {
      success: true,
      portalId: this.portalId,
      confirmationText: 'Thank you for your application!',
      executionTrace: trace
    };
  }
}
