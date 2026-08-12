import { IJobVerificationProvider, ProviderVerificationInput } from './providers/IJobVerificationProvider';
import { CompanyDomainProvider } from './providers/CompanyDomainProvider';
import { OfficialCareerPageProvider } from './providers/OfficialCareerPageProvider';
import { ATSVerificationProvider } from './providers/ATSVerificationProvider';
import { SearchVerificationProvider } from './providers/SearchVerificationProvider';
import { SourceMetadataProvider } from './providers/SourceMetadataProvider';
import { EvidenceItem, RiskSignal } from './JobVerificationTypes';

export interface CompanyVerificationResult {
  companyVerified: boolean;
  officialCareerPageFound: boolean;
  officialDomainVerified: boolean;
  requisitionVerified: boolean;
  evidence: EvidenceItem[];
  riskSignals: RiskSignal[];
}

export class CompanyVerificationService {
  private static instance: CompanyVerificationService;
  private providers: IJobVerificationProvider[];

  private constructor() {
    this.providers = [
      new CompanyDomainProvider(),
      new OfficialCareerPageProvider(),
      new ATSVerificationProvider(),
      new SearchVerificationProvider(),
      new SourceMetadataProvider()
    ];
  }

  public static getInstance(): CompanyVerificationService {
    if (!CompanyVerificationService.instance) {
      CompanyVerificationService.instance = new CompanyVerificationService();
    }
    return CompanyVerificationService.instance;
  }

  public registerProvider(provider: IJobVerificationProvider) {
    this.providers.push(provider);
  }

  public async verifyCompanyAndJob(input: ProviderVerificationInput): Promise<CompanyVerificationResult> {
    const aggregatedEvidence: EvidenceItem[] = [];
    const aggregatedRiskSignals: RiskSignal[] = [];

    let officialCareerPageFound = false;
    let officialDomainVerified = false;
    let requisitionVerified = false;

    for (const provider of this.providers) {
      if (!provider.enabled) continue;
      try {
        const result = await provider.verify(input);
        aggregatedEvidence.push(...result.evidence);
        aggregatedRiskSignals.push(...result.riskSignals);

        if (provider.name === 'OfficialCareerPageProvider' && result.verified) {
          officialCareerPageFound = true;
        }
        if (provider.name === 'CompanyDomainProvider' && result.verified) {
          officialDomainVerified = true;
        }
        if (provider.name === 'ATSVerificationProvider' && result.verified) {
          officialCareerPageFound = true;
          requisitionVerified = true;
        }
      } catch (err) {
        console.error(`[CompanyVerificationService] Provider ${provider.name} error:`, err);
      }
    }

    const companyVerified = officialCareerPageFound || officialDomainVerified || requisitionVerified;

    return {
      companyVerified,
      officialCareerPageFound,
      officialDomainVerified,
      requisitionVerified,
      evidence: aggregatedEvidence,
      riskSignals: aggregatedRiskSignals
    };
  }
}
