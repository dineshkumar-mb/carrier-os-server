import mongoose from 'mongoose';
import { CandidateApplicationProfile } from '../../models/CandidateApplicationProfile';
import { TenantContext } from '../../core/tenant/TenantContext';

export interface BrowserExecutionPlan {
  executionId: string;
  applicationId: string;
  tenantId: string;
  userId: string;
  applicationUrl: string;
  resumeArtifactId?: string;
  coverLetterArtifactId?: string;
  candidateProfileData: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedInUrl?: string;
    gitHubUrl?: string;
    workAuthorization: string;
    visaSponsorshipNeeded: boolean;
    noticePeriodDays: number;
    customAnswersMap: Record<string, string>;
  };
  allowedActions: ('NAVIGATE' | 'FILL_TEXT' | 'SELECT_OPTION' | 'UPLOAD_FILE' | 'SUBMIT')[];
  requiresHumanApproval: boolean;
  approvalReason?: string;
  createdAt: Date;
}

export class BrowserExecutionPlanService {
  private static instance: BrowserExecutionPlanService;

  private constructor() {}

  public static getInstance(): BrowserExecutionPlanService {
    if (!BrowserExecutionPlanService.instance) {
      BrowserExecutionPlanService.instance = new BrowserExecutionPlanService();
    }
    return BrowserExecutionPlanService.instance;
  }

  public async generatePlan(params: {
    tenantContext: TenantContext;
    executionId: string;
    applicationId: string;
    applicationUrl: string;
    resumeArtifactId?: string;
    coverLetterArtifactId?: string;
    formQuestions?: string[];
  }): Promise<BrowserExecutionPlan> {
    const { tenantContext, executionId, applicationId, applicationUrl, resumeArtifactId, coverLetterArtifactId, formQuestions } = params;

    const isConnected = mongoose.connection.readyState === 1;
    let profileDoc: any = null;
    if (isConnected) {
      profileDoc = await CandidateApplicationProfile.findOne({ userId: tenantContext.userId }).catch(() => null);
    }

    const profileData = {
      fullName: profileDoc?.fullName || 'John Doe',
      email: profileDoc?.email || tenantContext.userId,
      phone: profileDoc?.phone || '+15550199',
      location: profileDoc?.location || 'San Francisco, CA',
      linkedInUrl: profileDoc?.linkedInUrl || 'https://linkedin.com/in/johndoe',
      gitHubUrl: profileDoc?.gitHubUrl || 'https://github.com/johndoe',
      workAuthorization: profileDoc?.workAuthorization || 'Authorized to work',
      visaSponsorshipNeeded: profileDoc?.visaSponsorshipNeeded || false,
      noticePeriodDays: profileDoc?.noticePeriodDays || 0,
      customAnswersMap: profileDoc?.customAnswersMap || {}
    };

    let requiresHumanApproval = false;
    let approvalReason: string | undefined;

    // Check for unknown form questions
    if (formQuestions && formQuestions.length > 0) {
      for (const q of formQuestions) {
        const qLower = q.toLowerCase();
        const hasAnswer = Object.keys(profileData.customAnswersMap).some(k => k.toLowerCase().includes(qLower));
        const isStandardQuestion = qLower.includes('name') || qLower.includes('email') || qLower.includes('phone') || qLower.includes('resume') || qLower.includes('linkedin');

        if (!hasAnswer && !isStandardQuestion) {
          requiresHumanApproval = true;
          approvalReason = `Unknown form question detected: "${q}". Pausing for user sign-off.`;
          break;
        }
      }
    }

    const allowedActions: ('NAVIGATE' | 'FILL_TEXT' | 'SELECT_OPTION' | 'UPLOAD_FILE' | 'SUBMIT')[] = [
      'NAVIGATE',
      'FILL_TEXT',
      'SELECT_OPTION',
      'UPLOAD_FILE'
    ];

    if (!requiresHumanApproval) {
      allowedActions.push('SUBMIT');
    }

    return {
      executionId,
      applicationId,
      tenantId: tenantContext.tenantId,
      userId: tenantContext.userId,
      applicationUrl,
      resumeArtifactId,
      coverLetterArtifactId,
      candidateProfileData: profileData,
      allowedActions,
      requiresHumanApproval,
      approvalReason,
      createdAt: new Date()
    };
  }
}
