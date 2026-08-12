import { IJobVerificationProvider, ProviderVerificationInput, ProviderVerificationOutput, IExternalSearchProvider } from './IJobVerificationProvider';
import { JobEvidenceService } from '../JobEvidenceService';
import { EvidenceItem, RiskSignal } from '../JobVerificationTypes';

export class SearchVerificationProvider implements IJobVerificationProvider {
  public name = 'SearchVerificationProvider';
  public enabled = true;
  private externalSearchProvider: IExternalSearchProvider | null = null;

  constructor(externalSearchProvider?: IExternalSearchProvider) {
    if (externalSearchProvider) {
      this.externalSearchProvider = externalSearchProvider;
    }
  }

  public setExternalSearchProvider(provider: IExternalSearchProvider) {
    this.externalSearchProvider = provider;
  }

  public async verify(input: ProviderVerificationInput): Promise<ProviderVerificationOutput> {
    const evidenceService = JobEvidenceService.getInstance();
    const evidenceList: EvidenceItem[] = [];
    const riskSignals: RiskSignal[] = [];

    if (!this.externalSearchProvider || !this.externalSearchProvider.isAvailable()) {
      // Search provider unavailable / not configured
      evidenceList.push(
        evidenceService.createEvidenceItem({
          type: 'COMPANY_IDENTITY',
          strength: 'WEAK',
          provenance: 'DERIVED',
          sourceProvider: this.name,
          details: 'External search provider is unavailable or disabled. Search verification marked UNAVAILABLE.'
        })
      );

      return {
        providerName: this.name,
        verified: false,
        evidence: evidenceList,
        riskSignals,
        metadata: { searchStatus: 'UNAVAILABLE' }
      };
    }

    try {
      const result = await this.externalSearchProvider.searchCompanyCareers(input.company, input.title);

      if (result.found) {
        evidenceList.push(
          evidenceService.createEvidenceItem({
            type: 'CROSS_SOURCE_MATCH',
            strength: 'MEDIUM',
            provenance: 'INDEPENDENT',
            sourceUrl: result.url,
            sourceProvider: this.externalSearchProvider.name,
            details: `External search confirmed official company career listing for ${input.company}.`
          })
        );
      }

      return {
        providerName: this.name,
        verified: result.found,
        evidence: evidenceList,
        riskSignals,
        metadata: { searchStatus: result.found ? 'FOUND' : 'NOT_FOUND' }
      };
    } catch {
      evidenceList.push(
        evidenceService.createEvidenceItem({
          type: 'COMPANY_IDENTITY',
          strength: 'WEAK',
          provenance: 'DERIVED',
          sourceProvider: this.name,
          details: 'External search query failed. Search verification marked UNAVAILABLE.'
        })
      );

      return {
        providerName: this.name,
        verified: false,
        evidence: evidenceList,
        riskSignals,
        metadata: { searchStatus: 'ERROR' }
      };
    }
  }
}
