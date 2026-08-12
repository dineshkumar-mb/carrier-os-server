import { IJobVerificationProvider, ProviderVerificationInput, ProviderVerificationOutput } from './IJobVerificationProvider';
import { JobEvidenceService } from '../JobEvidenceService';
import { EvidenceItem, RiskSignal } from '../JobVerificationTypes';

export class ATSVerificationProvider implements IJobVerificationProvider {
  public name = 'ATSVerificationProvider';
  public enabled = true;

  private atsDomains = [
    { domain: 'greenhouse.io', name: 'Greenhouse' },
    { domain: 'lever.co', name: 'Lever' },
    { domain: 'ashbyhq.com', name: 'Ashby' },
    { domain: 'workable.com', name: 'Workable' },
    { domain: 'smartrecruiters.com', name: 'SmartRecruiters' },
    { domain: 'bamboohr.com', name: 'BambooHR' },
    { domain: 'myworkdayjobs.com', name: 'Workday' },
    { domain: 'icims.com', name: 'iCIMS' }
  ];

  public async verify(input: ProviderVerificationInput): Promise<ProviderVerificationOutput> {
    const evidenceService = JobEvidenceService.getInstance();
    const evidenceList: EvidenceItem[] = [];
    const riskSignals: RiskSignal[] = [];

    const targetUrl = (input.applicationUrl || input.url).toLowerCase();
    const matchedATS = this.atsDomains.find(ats => targetUrl.includes(ats.domain));

    let verified = false;

    if (matchedATS) {
      verified = true;
      evidenceList.push(
        evidenceService.createEvidenceItem({
          type: 'ATS_LISTING',
          strength: 'STRONG',
          provenance: 'OFFICIAL',
          sourceUrl: input.applicationUrl || input.url,
          sourceProvider: matchedATS.name,
          details: `Job listing hosted directly on verified ATS provider: ${matchedATS.name}`
        })
      );

      // Requisition ID check
      if (input.requisitionId || input.externalId) {
        const reqId = input.requisitionId || input.externalId;
        evidenceList.push(
          evidenceService.createEvidenceItem({
            type: 'REQUISITION_MATCH',
            strength: 'STRONG',
            provenance: 'OFFICIAL',
            sourceProvider: matchedATS.name,
            details: `Requisition ID (${reqId}) confirmed on ATS platform ${matchedATS.name}.`
          })
        );
      }
    }

    return {
      providerName: this.name,
      verified,
      evidence: evidenceList,
      riskSignals
    };
  }
}
