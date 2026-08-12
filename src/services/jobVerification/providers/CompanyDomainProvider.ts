import { IJobVerificationProvider, ProviderVerificationInput, ProviderVerificationOutput } from './IJobVerificationProvider';
import { JobEvidenceService } from '../JobEvidenceService';
import { EvidenceItem, RiskSignal } from '../JobVerificationTypes';

export class CompanyDomainProvider implements IJobVerificationProvider {
  public name = 'CompanyDomainProvider';
  public enabled = true;

  public async verify(input: ProviderVerificationInput): Promise<ProviderVerificationOutput> {
    const evidenceService = JobEvidenceService.getInstance();
    const evidenceList: EvidenceItem[] = [];
    const riskSignals: RiskSignal[] = [];

    const jobHost = evidenceService.extractHostname(input.url);
    const expectedDomain = evidenceService.extractCompanyDomain(input.company);

    let verified = false;

    // Check if domain matches company name or expected domain
    if (jobHost.includes(expectedDomain.replace('.com', '')) || expectedDomain.includes(jobHost.replace('.com', ''))) {
      verified = true;
      evidenceList.push(
        evidenceService.createEvidenceItem({
          type: 'OFFICIAL_COMPANY_DOMAIN',
          strength: 'STRONG',
          provenance: 'OFFICIAL',
          sourceUrl: input.url,
          sourceProvider: this.name,
          details: `Application domain '${jobHost}' matches expected company domain structure '${expectedDomain}'.`
        })
      );
    } else {
      evidenceList.push(
        evidenceService.createEvidenceItem({
          type: 'DOMAIN_MATCH',
          strength: 'MEDIUM',
          provenance: 'SOURCE',
          sourceUrl: input.url,
          sourceProvider: this.name,
          details: `Job hosted on domain '${jobHost}' for company '${input.company}'.`
        })
      );
    }

    // Check recruiter email domain if provided
    if (input.recruiterEmail) {
      const emailDomain = input.recruiterEmail.split('@')[1]?.toLowerCase();
      const freeEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

      if (emailDomain) {
        if (freeEmailDomains.includes(emailDomain)) {
          riskSignals.push({
            code: 'SUSPICIOUS_RECRUITER_EMAIL_DOMAIN',
            severity: 'MEDIUM',
            description: `Recruiter email '${input.recruiterEmail}' uses a public free email domain (${emailDomain}) instead of a corporate domain.`,
            penalty: 10
          });
        } else if (emailDomain.includes(expectedDomain.replace('.com', ''))) {
          evidenceList.push(
            evidenceService.createEvidenceItem({
              type: 'COMPANY_IDENTITY',
              strength: 'STRONG',
              provenance: 'OFFICIAL',
              sourceProvider: this.name,
              details: `Recruiter email '${input.recruiterEmail}' matches company corporate domain.`
            })
          );
        }
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
