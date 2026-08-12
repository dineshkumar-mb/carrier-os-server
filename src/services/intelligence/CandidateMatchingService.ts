import mongoose from 'mongoose';
import { CandidateJobMatch, ICandidateJobMatchDocument } from '../../models/CandidateJobMatch';
import { CareerProfile } from '../../models/CareerProfile';
import { Job } from '../../models/Job';
import { SkillGraphService } from './SkillGraphService';
import { TenantContext } from '../../core/tenant/TenantContext';

export interface EvaluateFitRequest {
  tenantContext: TenantContext;
  canonicalJobId: string;
}

export class CandidateMatchingService {
  private static instance: CandidateMatchingService;
  private skillService: SkillGraphService;

  private constructor() {
    this.skillService = SkillGraphService.getInstance();
  }

  public static getInstance(): CandidateMatchingService {
    if (!CandidateMatchingService.instance) {
      CandidateMatchingService.instance = new CandidateMatchingService();
    }
    return CandidateMatchingService.instance;
  }

  public async evaluateCandidateFit(req: EvaluateFitRequest): Promise<ICandidateJobMatchDocument> {
    const { tenantContext, canonicalJobId } = req;
    const userId = tenantContext.userId;
    const tenantId = tenantContext.tenantId;
    const isConnected = mongoose.connection.readyState === 1;

    let canonicalJob: any = null;
    if (isConnected) {
      canonicalJob = await Job.findById(canonicalJobId).catch(() => null);
    }

    if (!canonicalJob) {
      canonicalJob = {
        _id: canonicalJobId,
        title: 'Senior React Developer',
        company: 'TechCorp',
        location: 'Remote',
        skills: ['React', 'TypeScript', 'Node.js'],
        url: 'https://techcorp.com/careers/react-dev',
        source: 'greenhouse',
        status: 'active'
      };
    }

    let careerProfile: any = null;
    if (isConnected) {
      careerProfile = await CareerProfile.findOne({ userId }).catch(() => null);
    }

    const jobSkills = canonicalJob.skills || [];
    const coverage = this.skillService.calculateCoverage(userId, jobSkills);

    // 1. Skill Match
    const skillMatch = coverage.coverageScore;

    // 2. Experience & Role Match
    let roleMatch = 75;
    if (careerProfile?.targetRoles && careerProfile.targetRoles.length > 0) {
      const isRoleMatched = careerProfile.targetRoles.some((role: string) =>
        canonicalJob.title.toLowerCase().includes(role.toLowerCase())
      );
      roleMatch = isRoleMatched ? 95 : 65;
    }

    let experienceMatch = 80;
    if (careerProfile?.yearsOfExperience) {
      if (careerProfile.yearsOfExperience >= 5) experienceMatch = 90;
      else if (careerProfile.yearsOfExperience >= 2) experienceMatch = 80;
    }

    // 3. Location Match
    let locationMatch = 85;
    if (canonicalJob.remoteStatus === 'Remote') {
      locationMatch = 100;
    } else if (careerProfile?.targetLocations && careerProfile.targetLocations.length > 0) {
      const isLocationMatched = careerProfile.targetLocations.some((loc: string) =>
        canonicalJob.location.toLowerCase().includes(loc.toLowerCase())
      );
      locationMatch = isLocationMatched ? 95 : 60;
    }

    // 4. Salary Match
    let salaryMatch = 80;
    if (canonicalJob.salary?.min && careerProfile?.minSalary) {
      salaryMatch = canonicalJob.salary.min >= careerProfile.minSalary ? 95 : 65;
    }

    // 5. Project Match
    const projectMatch = Math.min(100, Math.round(skillMatch * 0.9 + 10));

    // 6. Overall Match Calculation
    const overallMatch = Math.round(
      skillMatch * 0.35 +
      roleMatch * 0.25 +
      experienceMatch * 0.15 +
      locationMatch * 0.15 +
      salaryMatch * 0.10
    );

    // Strengths and Concerns
    const strengths: string[] = [];
    const concerns: string[] = [];

    if (coverage.matchedSkills.length > 0) {
      strengths.push(`Strong overlap in core skills: ${coverage.matchedSkills.slice(0, 4).join(', ')}.`);
    }
    if (locationMatch >= 95) {
      strengths.push('High location alignment (Remote/Preferred Location).');
    }
    if (coverage.missingSkills.length > 0) {
      concerns.push(`Missing skills: ${coverage.missingSkills.join(', ')}.`);
    }
    if (salaryMatch < 70) {
      concerns.push('Offered salary below target minimum expectation.');
    }

    // Callback probabilities
    const interviewProbability = Number((Math.min(0.95, Math.max(0.15, overallMatch / 100 * 0.85)).toFixed(2)));
    const offerProbability = Number((Math.min(0.85, Math.max(0.05, interviewProbability * 0.7)).toFixed(2)));

    // Upsert CandidateJobMatch if connected
    if (isConnected) {
      return await CandidateJobMatch.findOneAndUpdate(
        { userId, canonicalJobId },
        {
          $set: {
            userId,
            tenantId,
            canonicalJobId,
            overallMatch,
            skillMatch,
            experienceMatch,
            roleMatch,
            locationMatch,
            salaryMatch,
            projectMatch,
            missingSkills: coverage.missingSkills,
            strengths,
            concerns,
            interviewProbability,
            offerProbability,
            evaluatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
    }

    return {
      _id: 'match_mock_123',
      userId,
      tenantId,
      canonicalJobId,
      overallMatch,
      skillMatch,
      experienceMatch,
      roleMatch,
      locationMatch,
      salaryMatch,
      projectMatch,
      missingSkills: coverage.missingSkills,
      strengths,
      concerns,
      interviewProbability,
      offerProbability,
      evaluatedAt: new Date()
    } as any;
  }
}
