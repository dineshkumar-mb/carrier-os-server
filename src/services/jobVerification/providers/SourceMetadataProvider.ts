import { IJobVerificationProvider, ProviderVerificationInput, ProviderVerificationOutput } from './IJobVerificationProvider';
import { JobEvidenceService } from '../JobEvidenceService';
import { EvidenceItem, RiskSignal, SourceReliabilityProfile } from '../JobVerificationTypes';

export class SourceMetadataProvider implements IJobVerificationProvider {
  public name = 'SourceMetadataProvider';
  public enabled = true;

  private defaultProfiles: Record<string, SourceReliabilityProfile> = {
    'greenhouse': { provider: 'greenhouse', reliabilityScore: 95, supportsExternalId: true, supportsCanonicalUrl: true, supportsCompanyDomain: true },
    'lever': { provider: 'lever', reliabilityScore: 95, supportsExternalId: true, supportsCanonicalUrl: true, supportsCompanyDomain: true },
    'ashby': { provider: 'ashby', reliabilityScore: 95, supportsExternalId: true, supportsCanonicalUrl: true, supportsCompanyDomain: true },
    'arbeitnow': { provider: 'arbeitnow', reliabilityScore: 85, supportsExternalId: true, supportsCanonicalUrl: true, supportsCompanyDomain: true },
    'remotive': { provider: 'remotive', reliabilityScore: 80, supportsExternalId: true, supportsCanonicalUrl: true, supportsCompanyDomain: false },
    'naukri': { provider: 'naukri', reliabilityScore: 70, supportsExternalId: true, supportsCanonicalUrl: false, supportsCompanyDomain: false },
    'linkedin': { provider: 'linkedin', reliabilityScore: 75, supportsExternalId: true, supportsCanonicalUrl: false, supportsCompanyDomain: true },
    'indeed': { provider: 'indeed', reliabilityScore: 65, supportsExternalId: true, supportsCanonicalUrl: false, supportsCompanyDomain: false },
    'scraped_custom': { provider: 'scraped_custom', reliabilityScore: 50, supportsExternalId: false, supportsCanonicalUrl: false, supportsCompanyDomain: false }
  };

  public async verify(input: ProviderVerificationInput): Promise<ProviderVerificationOutput> {
    const evidenceService = JobEvidenceService.getInstance();
    const evidenceList: EvidenceItem[] = [];
    const riskSignals: RiskSignal[] = [];

    const srcKey = input.source.toLowerCase();
    const profile = this.defaultProfiles[srcKey] || {
      provider: input.source,
      reliabilityScore: 60,
      supportsExternalId: !!input.externalId,
      supportsCanonicalUrl: true,
      supportsCompanyDomain: false
    };

    const isHighReliability = profile.reliabilityScore >= 80;

    evidenceList.push(
      evidenceService.createEvidenceItem({
        type: 'JOB_URL_VALID',
        strength: isHighReliability ? 'STRONG' : 'MEDIUM',
        provenance: 'SOURCE',
        sourceUrl: input.url,
        sourceProvider: input.source,
        details: `Job discovered via source '${input.source}' (reliability score: ${profile.reliabilityScore}/100).`
      })
    );

    return {
      providerName: this.name,
      verified: isHighReliability,
      evidence: evidenceList,
      riskSignals,
      metadata: { profile }
    };
  }
}
