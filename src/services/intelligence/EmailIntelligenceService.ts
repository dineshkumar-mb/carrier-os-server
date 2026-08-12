import mongoose from 'mongoose';
import { Application } from '../../models/Application';
import { TenantContext } from '../../core/tenant/TenantContext';

export type RecruiterEmailCategory =
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_REJECTED'
  | 'ASSESSMENT_REQUEST'
  | 'INTERVIEW_REQUEST'
  | 'RECRUITER_CONTACT'
  | 'OFFER'
  | 'OTHER';

export interface EmailClassificationResult {
  category: RecruiterEmailCategory;
  company?: string;
  roleTitle?: string;
  interviewDate?: Date;
  confidence: number;
  extractedNotes: string;
}

export class EmailIntelligenceService {
  private static instance: EmailIntelligenceService;

  private constructor() {}

  public static getInstance(): EmailIntelligenceService {
    if (!EmailIntelligenceService.instance) {
      EmailIntelligenceService.instance = new EmailIntelligenceService();
    }
    return EmailIntelligenceService.instance;
  }

  public classifyEmail(subject: string, snippet: string): EmailClassificationResult {
    const text = `${subject} ${snippet}`.toLowerCase();

    if (text.includes('offer') || text.includes('congratulations') || text.includes('pleased to offer')) {
      return {
        category: 'OFFER',
        confidence: 0.95,
        extractedNotes: 'Offer email detected with high confidence.'
      };
    }

    if (text.includes('interview') || text.includes('schedule time') || text.includes('chat with our team')) {
      return {
        category: 'INTERVIEW_REQUEST',
        confidence: 0.92,
        extractedNotes: 'Interview request email detected.'
      };
    }

    if (text.includes('regret') || text.includes('unable to move forward') || text.includes('pursuing other candidates')) {
      return {
        category: 'APPLICATION_REJECTED',
        confidence: 0.94,
        extractedNotes: 'Rejection notification email detected.'
      };
    }

    if (text.includes('thank you for applying') || text.includes('application received') || text.includes('received your application')) {
      return {
        category: 'APPLICATION_RECEIVED',
        confidence: 0.96,
        extractedNotes: 'Application submission confirmation detected.'
      };
    }

    return {
      category: 'OTHER',
      confidence: 0.70,
      extractedNotes: 'General recruiter communication.'
    };
  }

  public async processRecruiterEmail(params: {
    tenantContext: TenantContext;
    subject: string;
    snippet: string;
    fromEmail: string;
    applicationId?: string;
  }): Promise<EmailClassificationResult> {
    const { tenantContext, subject, snippet, fromEmail, applicationId } = params;

    const classification = this.classifyEmail(subject, snippet);
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      let app = applicationId ? await Application.findById(applicationId) : null;
      if (!app) {
        app = await Application.findOne({ userId: tenantContext.userId }).sort({ updatedAt: -1 });
      }

      if (app) {
        if (classification.category === 'INTERVIEW_REQUEST') {
          app.status = 'INTERVIEW';
        } else if (classification.category === 'OFFER') {
          app.status = 'OFFER';
        } else if (classification.category === 'APPLICATION_REJECTED') {
          app.status = 'REJECTED';
        } else if (classification.category === 'APPLICATION_RECEIVED') {
          app.status = 'CONFIRMATION_RECEIVED';
          app.confirmationAt = new Date();
        }

        app.timeline.push({
          status: app.status,
          timestamp: new Date(),
          note: `Recruiter email classified as ${classification.category} from ${fromEmail}: "${subject}"`
        });

        await app.save();
      }
    }

    return classification;
  }
}
