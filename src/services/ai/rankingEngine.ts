import { aiProvider, cleanJsonString } from './aiClient';
import { CareerProfile } from '../../models/CareerProfile';
import { IJob } from '../../types';

export interface RankingResult {
  matchScore: number;
  matchReasons: string[];
  missingSkills: string[];
  recommendedSkills: string[];
}

export const rankJob = async (userId: string, job: IJob): Promise<RankingResult> => {
  try {
    const profile = await CareerProfile.findOne({ userId });
    if (!profile) {
      return {
        matchScore: 50,
        matchReasons: ['No Career Profile found. Please upload a master resume first.'],
        missingSkills: [],
        recommendedSkills: []
      };
    }

    const prompt = `
    Candidate Career Profile:
    ${JSON.stringify({
      primaryRole: profile.primaryRole,
      seniority: profile.seniority,
      experience: profile.experience,
      skills: profile.skills,
      preferredTechStack: profile.preferredTechStack,
      remotePreference: profile.remotePreference
    }, null, 2)}

    Job Details:
    Company: ${job.company}
    Title: ${job.title}
    Location: ${job.location}
    Description: ${job.description}
    Skills Required: ${JSON.stringify(job.skills)}

    Evaluate the candidate's alignment with this job posting.
    Calculate a match score (0-100) based on:
    - Tech stack/skills match
    - Seniority/Role alignment
    - Remote/Onsite preferences
    
    Return ONLY a JSON object matching this schema:
    {
      "matchScore": number,
      "matchReasons": ["string"],
      "missingSkills": ["string"],
      "recommendedSkills": ["string"]
    }
    `;

    const systemPrompt = `You are a professional recruiting algorithm. Evaluate the job match and return strictly raw valid JSON.`;

    const response = await aiProvider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { jsonMode: true });

    const cleaned = cleanJsonString(response);
    const parsed = JSON.parse(cleaned);

    return {
      matchScore: Number(parsed.matchScore) || 0,
      matchReasons: parsed.matchReasons || [],
      missingSkills: parsed.missingSkills || [],
      recommendedSkills: parsed.recommendedSkills || []
    };
  } catch (error) {
    console.error('Error ranking job:', error);
    return {
      matchScore: 0,
      matchReasons: ['Failed to compute score via AI'],
      missingSkills: [],
      recommendedSkills: []
    };
  }
};
