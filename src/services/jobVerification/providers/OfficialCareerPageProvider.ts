import { IJobVerificationProvider, ProviderVerificationInput, ProviderVerificationOutput } from './IJobVerificationProvider';
import { JobEvidenceService } from '../JobEvidenceService';
import { EvidenceItem, RiskSignal } from '../JobVerificationTypes';

export class OfficialCareerPageProvider implements IJobVerificationProvider {
  public name = 'OfficialCareerPageProvider';
  public enabled = true;

  public async verify(input: ProviderVerificationInput): Promise<ProviderVerificationOutput> {
    const evidenceService = JobEvidenceService.getInstance();
    const evidenceList: EvidenceItem[] = [];
    const riskSignals: RiskSignal[] = [];

    const urlLower = (input.url + (input.applicationUrl || '')).toLowerCase();
    const careerKeywords = ['/careers', '/jobs', '/work-with-us', 'careers.', 'jobs.'];
    const isCareerUrl = careerKeywords.some(kw => urlLower.includes(kw));

    if (isCareerUrl) {
      evidenceList.push(
        evidenceService.createEvidenceItem({
          type: 'OFFICIAL_COMPANY_CAREERS',
          strength: 'STRONG',
          provenance: 'OFFICIAL',
          sourceUrl: input.url,
          sourceProvider: this.name,
          details: `Job posting URL matches official corporate careers portal pattern (${input.url}).`
        })
      );
    }

    return {
      providerName: this.name,
      verified: isCareerUrl,
      evidence: evidenceList,
      riskSignals
    };
  }
}
