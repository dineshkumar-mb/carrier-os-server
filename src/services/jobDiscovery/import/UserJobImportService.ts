import { Job } from '../../../models/Job';
import { JobMatch } from '../../../models/JobMatch';
import { CanonicalJob } from '../CanonicalJob';
import { computeJobFingerprint } from '../JobFingerprint';
import { matchJobToProfile } from '../../ai/jobMatcherAgent';
import { CareerProfile } from '../../../models/CareerProfile';
import { Resume } from '../../../models/Resume';

interface ImportJobRequest {
  userId: string;
  jobUrl?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  sourcePlatform?: string;
}

export class UserJobImportService {
  public static async importUserJob(req: ImportJobRequest): Promise<any> {
    const { userId, jobUrl, jobTitle, companyName, jobDescription, sourcePlatform } = req;

    let finalTitle = jobTitle || 'Imported Career Opportunity';
    let finalCompany = companyName || 'Enterprise / Tech Hiring Manager';
    let finalDescription = jobDescription || `Imported job listing from ${jobUrl || sourcePlatform || 'Candidate Import'}`;
    let finalSource = sourcePlatform || (jobUrl ? this.extractDomain(jobUrl) : 'User Import');

    // If jobUrl provided without description, attempt authorized guest content fetch
    if (jobUrl && !jobDescription) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(jobUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const html = await res.text();
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          finalTitle = titleMatch[1].trim().slice(0, 100);
        }
      } catch (e) {
        console.warn(`[UserJobImport] Guest fetch notice for ${jobUrl}:`, (e as Error).message);
      }
    }

    const canonical: Partial<CanonicalJob> = {
      source: {
        provider: finalSource,
        originalUrl: jobUrl || 'https://carrier-os.user-import.internal',
        discoveredAt: new Date()
      },
      company: {
        name: finalCompany,
        normalizedName: finalCompany.toLowerCase().trim()
      },
      title: finalTitle,
      normalizedTitle: finalTitle.toLowerCase().trim(),
      description: finalDescription
    };

    const fingerprint = computeJobFingerprint(canonical);
    canonical.fingerprint = fingerprint;

    let jobDoc: any = await Job.findOne({ url: canonical.source!.originalUrl });
    if (!jobDoc) {
      jobDoc = await Job.create({
        title: canonical.title,
        company: canonical.company!.name,
        description: canonical.description,
        location: 'Remote / Candidate Specified',
        url: canonical.source!.originalUrl,
        applicationUrl: canonical.source!.originalUrl,
        source: finalSource,
        status: 'active',
        postedDate: new Date()
      });
    }

    // Match against candidate's profile
    let profile: any = await CareerProfile.findOne({ userId });
    if (!profile) {
      const resume = await Resume.findOne({ userId });
      profile = {
        primaryRole: canonical.title,
        skills: resume?.skills || [],
        seniority: 'Mid-level',
        remotePreference: 'Remote',
        memoryContext: 'User import'
      };
    }

    const matchDetails = await matchJobToProfile({
      title: canonical.title!,
      company: canonical.company!.name,
      description: canonical.description!,
      url: canonical.source!.originalUrl
    }, profile);

    let matchDoc = await JobMatch.findOne({ userId, jobId: jobDoc._id });
    if (!matchDoc) {
      matchDoc = await JobMatch.create({
        userId,
        jobId: jobDoc._id,
        matchScore: matchDetails.matchScore,
        matchReasons: matchDetails.matchReasons,
        missingSkills: matchDetails.missingSkills,
        recommendedSkills: matchDetails.recommendedSkills,
        confidenceScore: matchDetails.confidenceScore,
        salaryFit: matchDetails.salaryFit,
        locationFit: matchDetails.locationFit,
        experienceFit: matchDetails.experienceFit,
        applicationPriority: matchDetails.applicationPriority,
        state: 'Discovered',
        decision: 'REVIEW'
      });
    }

    return {
      job: jobDoc,
      match: matchDoc
    };
  }

  private static extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return 'User Import';
    }
  }
}
