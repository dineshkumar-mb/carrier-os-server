import { RiskSignal } from './JobVerificationTypes';
import { JobEvidenceService } from './JobEvidenceService';

export class JobRiskAnalyzer {
  private static instance: JobRiskAnalyzer;

  private constructor() {}

  public static getInstance(): JobRiskAnalyzer {
    if (!JobRiskAnalyzer.instance) {
      JobRiskAnalyzer.instance = new JobRiskAnalyzer();
    }
    return JobRiskAnalyzer.instance;
  }

  public analyzeJob(job: {
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    applicationUrl?: string;
    recruiterEmail?: string;
  }): RiskSignal[] {
    const signals: RiskSignal[] = [];
    const descLower = job.description.toLowerCase();
    const evidenceService = JobEvidenceService.getInstance();

    // 1. Fee / Payment Requests (CRITICAL - 100)
    const feeKeywords = [
      'registration fee',
      'training fee',
      'security deposit',
      'payment for interview',
      'payment for equipment',
      'send cryptocurrency',
      'bitcoin payment',
      'pay to get hired',
      'guaranteed job upon payment',
      'processing fee required'
    ];

    for (const kw of feeKeywords) {
      if (descLower.includes(kw)) {
        signals.push({
          code: 'PAYMENT_REQUESTED',
          severity: 'CRITICAL',
          description: `Job description explicitly requests payment or fees ('${kw}').`,
          penalty: 100
        });
        break;
      }
    }

    // 2. Sensitive Credential Requests (CRITICAL - 100)
    const credentialKeywords = [
      'bank credentials',
      'provide otp',
      'share password',
      'social security number before interview',
      'credit card details required'
    ];

    for (const kw of credentialKeywords) {
      if (descLower.includes(kw)) {
        signals.push({
          code: 'CREDENTIAL_REQUESTED',
          severity: 'CRITICAL',
          description: `Job description requests sensitive financial credentials or security codes ('${kw}').`,
          penalty: 100
        });
        break;
      }
    }

    // 3. Domain Mismatch / Unrelated Redirects (HIGH - 40 to 50)
    const appUrl = job.applicationUrl || job.url;
    const appHost = evidenceService.extractHostname(appUrl);
    const expectedDomainKey = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');

    const commonPublicJobBoards = [
      'greenhouse.io', 'lever.co', 'ashbyhq.com', 'workable.com',
      'smartrecruiters.com', 'bamboohr.com', 'myworkdayjobs.com',
      'linkedin.com', 'indeed.com', 'naukri.com', 'arbeitnow.com', 'remotive.com'
    ];

    const isJobBoardOrATS = commonPublicJobBoards.some(board => appHost.includes(board));

    if (!isJobBoardOrATS && expectedDomainKey.length > 3) {
      const hostCleaned = appHost.replace(/[^a-z0-9]/g, '');
      if (!hostCleaned.includes(expectedDomainKey) && !expectedDomainKey.includes(hostCleaned)) {
        signals.push({
          code: 'UNRELATED_APPLICATION_DOMAIN',
          severity: 'HIGH',
          description: `Application URL domain (${appHost}) has no recognizable relationship to company name '${job.company}'.`,
          penalty: 40
        });
      }
    }

    // 4. WhatsApp / Telegram-only Recruitment (MEDIUM - 25)
    if (
      (descLower.includes('whatsapp only') || descLower.includes('contact on telegram') || descLower.includes('telegram recruitment')) &&
      !isJobBoardOrATS
    ) {
      signals.push({
        code: 'SUSPICIOUS_COMMUNICATION_CHANNEL',
        severity: 'MEDIUM',
        description: 'Recruitment is restricted exclusively to instant messaging platforms (WhatsApp/Telegram).',
        penalty: 25
      });
    }

    // 5. Excessive Urgency & Unrealistic Promises (MEDIUM - 20)
    if (descLower.includes('100% guaranteed job') || descLower.includes('no interview required instant hiring')) {
      signals.push({
        code: 'UNREALISTIC_JOB_PROMISE',
        severity: 'MEDIUM',
        description: 'Listing promises guaranteed employment or instant hiring without candidate evaluation.',
        penalty: 20
      });
    }

    return signals;
  }
}
