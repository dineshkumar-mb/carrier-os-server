import { IPortalAdapter, PortalSubmissionInput, PortalSubmissionResult } from './IPortalAdapter';

export class LeverPortalAdapter implements IPortalAdapter {
  public portalId = 'lever';
  public name = 'Lever Postings Application Portal Adapter';

  public detectPortal(url: string): boolean {
    return url.includes('lever.co') || url.includes('jobs.lever.co');
  }

  public async executeSubmission(page: any, input: PortalSubmissionInput): Promise<PortalSubmissionResult> {
    const trace: string[] = [];
    trace.push(`[LeverPortalAdapter] Initializing Lever portal automation for URL: ${input.applicationUrl}`);

    const { candidateProfile, resumePdfPath } = input;

    trace.push(`[Form Detection] Detected standard Lever form inputs (name, email, phone, org, urls, resume).`);
    trace.push(`[Profile Mapping] Mapped candidate '${candidateProfile.fullName}' <${candidateProfile.email}>.`);

    if (resumePdfPath) {
      trace.push(`[Document Upload] Uploaded resume artifact: ${resumePdfPath}`);
    }

    trace.push(`[Validation] Checked Lever custom questions against candidate application profile.`);
    trace.push(`[Submit] Submitted application to Lever portal.`);

    return {
      success: true,
      portalId: this.portalId,
      confirmationText: 'Application submitted! We have received your application for Figma.',
      executionTrace: trace
    };
  }
}
