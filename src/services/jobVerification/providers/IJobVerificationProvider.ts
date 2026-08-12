import { EvidenceItem, RiskSignal, FreshnessStatus } from '../JobVerificationTypes';

export interface ProviderVerificationInput {
  canonicalJobId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  applicationUrl?: string;
  description: string;
  source: string;
  externalId?: string;
  requisitionId?: string;
  recruiterEmail?: string;
}

export interface ProviderVerificationOutput {
  providerName: string;
  verified: boolean;
  evidence: EvidenceItem[];
  riskSignals: RiskSignal[];
  freshnessStatus?: FreshnessStatus;
  metadata?: Record<string, any>;
}

export interface IJobVerificationProvider {
  name: string;
  enabled: boolean;
  verify(input: ProviderVerificationInput): Promise<ProviderVerificationOutput>;
}

export interface IExternalSearchProvider {
  name: string;
  isAvailable(): boolean;
  searchCompanyCareers(companyName: string, title: string): Promise<{ url?: string; snippet?: string; found: boolean }>;
}
