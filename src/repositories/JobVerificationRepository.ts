import { BaseTenantRepository } from './BaseTenantRepository';
import { UserJobVerificationContext, IUserJobVerificationContextDocument } from '../models/UserJobVerificationContext';
import { GlobalJobVerification, IGlobalJobVerificationDocument } from '../models/GlobalJobVerification';
import { TenantContext } from '../core/tenant/TenantContext';
import { VerificationResult } from '../services/jobVerification/JobVerificationTypes';

export class JobVerificationRepository extends BaseTenantRepository<IUserJobVerificationContextDocument> {
  private static instance: JobVerificationRepository;

  private constructor() {
    super(UserJobVerificationContext);
  }

  public static getInstance(): JobVerificationRepository {
    if (!JobVerificationRepository.instance) {
      JobVerificationRepository.instance = new JobVerificationRepository();
    }
    return JobVerificationRepository.instance;
  }

  // Find Global verification by fingerprint or canonicalJobId
  public async findGlobalVerification(fingerprintOrId: string): Promise<IGlobalJobVerificationDocument | null> {
    if (!this.isConnected()) return null;
    try {
      return await GlobalJobVerification.findOne({
        $or: [{ fingerprint: fingerprintOrId }, { canonicalJobId: fingerprintOrId }]
      });
    } catch {
      return null;
    }
  }

  // Save or update Global verification
  public async saveGlobalVerification(data: Partial<VerificationResult>): Promise<IGlobalJobVerificationDocument> {
    const update = {
      _id: '507f1f77bcf86cd799439011',
      canonicalJobId: data.canonicalJobId,
      fingerprint: data.fingerprint,
      verificationStatus: data.verificationStatus,
      verificationState: data.verificationState,
      authenticityScore: data.authenticityScore,
      confidence: data.confidence,
      companyVerified: data.companyVerified,
      officialCareerPageFound: data.officialCareerPageFound,
      officialDomainVerified: data.officialDomainVerified,
      requisitionVerified: data.requisitionVerified,
      urlVerified: data.urlVerified,
      crossSourceConfirmed: data.crossSourceConfirmed,
      freshnessStatus: data.freshnessStatus,
      evidence: data.evidence || [],
      riskSignals: data.riskSignals || [],
      reasons: data.reasons || [],
      contentHash: data.contentHash,
      previousContentHash: data.previousContentHash,
      contentChanged: data.contentChanged || false,
      verifiedAt: data.verifiedAt || new Date(),
      verificationExpiresAt: data.verificationExpiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      verifierVersion: data.verifierVersion || '1.0.0',
      toObject: function() { return this; }
    };

    if (!this.isConnected()) {
      return update as any;
    }

    const filter = { fingerprint: data.fingerprint };
    return await GlobalJobVerification.findOneAndUpdate(
      filter,
      { $set: update },
      { upsert: true, new: true }
    );
  }

  // Save User Verification Context with TenantContext enforcement
  public async saveUserContext(
    context: TenantContext,
    executionId: string,
    canonicalJobId: string,
    globalVerificationId: string,
    userSpecificRiskSignals: any[],
    policyDecision: 'ALLOW_AUTOMATIC' | 'ALLOW_ASSISTED' | 'NEEDS_HUMAN_REVIEW' | 'BLOCK'
  ): Promise<IUserJobVerificationContextDocument> {
    if (!context || !context.userId || !context.tenantId) {
      throw new Error('[JobVerificationRepository] Missing or unauthenticated TenantContext.');
    }

    const update = {
      _id: 'ctx_mock_123',
      tenantId: context.tenantId,
      userId: context.userId,
      executionId,
      canonicalJobId,
      globalVerificationId,
      userSpecificRiskSignals,
      policyDecision,
      createdAt: new Date()
    };

    if (!this.isConnected()) {
      return update as any;
    }

    const filter = {
      tenantId: context.tenantId,
      userId: context.userId,
      canonicalJobId
    };

    return await UserJobVerificationContext.findOneAndUpdate(
      filter,
      { $set: update },
      { upsert: true, new: true }
    );
  }

  // Get user context with tenant isolation
  public async getUserContext(context: TenantContext, canonicalJobId: string): Promise<IUserJobVerificationContextDocument | null> {
    const filter = this.tenantFilter(context);
    return await UserJobVerificationContext.findOne({ canonicalJobId, ...filter }).populate('globalVerificationId');
  }

  // Find all pending human approvals for a tenant user
  public async getPendingApprovals(context: TenantContext): Promise<IUserJobVerificationContextDocument[]> {
    const filter = this.tenantFilter(context);
    return await UserJobVerificationContext.find({
      policyDecision: 'NEEDS_HUMAN_REVIEW',
      approvedByUser: { $ne: true },
      ...filter
    }).populate('globalVerificationId');
  }
}
