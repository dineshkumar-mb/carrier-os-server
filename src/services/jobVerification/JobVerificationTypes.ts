export type VerificationStatus =
  | 'VERIFIED_HIGH_CONFIDENCE'
  | 'PROBABLY_REAL'
  | 'NEEDS_REVIEW'
  | 'SUSPICIOUS'
  | 'EXPIRED'
  | 'DUPLICATE'
  | 'INVALID';

export type VerificationState =
  | 'PENDING'
  | 'VALIDATING'
  | 'URL_VERIFIED'
  | 'COMPANY_VERIFIED'
  | 'FRESHNESS_VERIFIED'
  | 'CROSS_SOURCE_VERIFIED'
  | 'RISK_ANALYZED'
  | 'AI_REVIEWED'
  | 'GATE_EVALUATED'
  | 'COMPLETED'
  | 'REFRESH_REQUIRED'
  | 'FAILED';

export type FreshnessStatus =
  | 'ACTIVE'
  | 'STALE'
  | 'EXPIRED'
  | 'CLOSED'
  | 'UNKNOWN';

export type EvidenceType =
  | 'OFFICIAL_COMPANY_CAREERS'
  | 'OFFICIAL_COMPANY_DOMAIN'
  | 'ATS_LISTING'
  | 'REQUISITION_MATCH'
  | 'DOMAIN_MATCH'
  | 'CROSS_SOURCE_MATCH'
  | 'JOB_URL_VALID'
  | 'FRESH_LISTING'
  | 'COMPANY_IDENTITY'
  | 'RISK_SIGNAL';

export type EvidenceStrength = 'STRONG' | 'MEDIUM' | 'WEAK';

export type EvidenceProvenance =
  | 'OFFICIAL'
  | 'SOURCE'
  | 'INDEPENDENT'
  | 'USER_PROVIDED'
  | 'DERIVED';

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  strength: EvidenceStrength;
  provenance: EvidenceProvenance;
  sourceUrl?: string;
  sourceProvider?: string;
  observedAt: Date;
  contentHash?: string;
  details?: string;
}

export interface RiskSignal {
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  penalty: number;
}

export interface SourceReliabilityProfile {
  provider: string;
  reliabilityScore: number; // 0 - 100
  supportsExternalId: boolean;
  supportsCanonicalUrl: boolean;
  supportsCompanyDomain: boolean;
  lastSuccessfulSync?: Date;
  historicalDuplicateRate?: number;
  historicalStaleRate?: number;
}

export interface VerificationResult {
  canonicalJobId: string;
  fingerprint: string;
  verificationStatus: VerificationStatus;
  verificationState: VerificationState;
  authenticityScore: number;
  confidence: number;
  companyVerified: boolean;
  officialCareerPageFound: boolean;
  officialDomainVerified: boolean;
  requisitionVerified: boolean;
  urlVerified: boolean;
  crossSourceConfirmed: boolean;
  freshnessStatus: FreshnessStatus;
  evidence: EvidenceItem[];
  riskSignals: RiskSignal[];
  reasons: string[];
  contentHash: string;
  previousContentHash?: string;
  contentChanged?: boolean;
  verifiedAt: Date;
  verificationExpiresAt: Date;
  verifierVersion: string;
}

export interface UserVerificationContextResult {
  id?: string;
  tenantId: string;
  userId: string;
  executionId: string;
  canonicalJobId: string;
  globalVerificationId: string;
  userSpecificRiskSignals: RiskSignal[];
  policyDecision: 'ALLOW_AUTOMATIC' | 'ALLOW_ASSISTED' | 'NEEDS_HUMAN_REVIEW' | 'BLOCK';
  approvedByUser?: boolean;
  approvedAt?: Date;
  createdAt: Date;
}
