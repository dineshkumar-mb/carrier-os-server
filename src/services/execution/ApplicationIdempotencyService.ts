import crypto from 'crypto';
import mongoose from 'mongoose';
import { Application } from '../../models/Application';
import { TenantContext } from '../../core/tenant/TenantContext';

export interface IdempotencyCheckResult {
  idempotencyKey: string;
  canProceed: boolean;
  reason?: string;
  existingApplicationId?: string;
}

export class ApplicationIdempotencyService {
  private static instance: ApplicationIdempotencyService;

  private constructor() {}

  public static getInstance(): ApplicationIdempotencyService {
    if (!ApplicationIdempotencyService.instance) {
      ApplicationIdempotencyService.instance = new ApplicationIdempotencyService();
    }
    return ApplicationIdempotencyService.instance;
  }

  public computeKey(tenantId: string, userId: string, canonicalJobId: string): string {
    const raw = `${tenantId.toLowerCase().trim()}:${userId.toLowerCase().trim()}:${canonicalJobId.trim()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public async verifySubmissionIdempotency(params: {
    tenantContext: TenantContext;
    canonicalJobId: string;
  }): Promise<IdempotencyCheckResult> {
    const { tenantContext, canonicalJobId } = params;
    const { tenantId, userId } = tenantContext;

    const idempotencyKey = this.computeKey(tenantId, userId, canonicalJobId);
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const existingApp = await Application.findOne({
        tenantId,
        userId,
        canonicalJobId
      });

      if (existingApp && (existingApp.status === 'APPLIED' || existingApp.status === 'CONFIRMATION_RECEIVED')) {
        return {
          idempotencyKey,
          canProceed: false,
          reason: `IDEMPOTENCY BLOCK: Application for job ${canonicalJobId} is already in state '${existingApp.status}'. Double-submission strictly prohibited.`,
          existingApplicationId: existingApp._id.toString()
        };
      }
    }

    return {
      idempotencyKey,
      canProceed: true
    };
  }
}
