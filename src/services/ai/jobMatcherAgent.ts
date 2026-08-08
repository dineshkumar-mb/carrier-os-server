import { aiProvider, cleanJsonString, safeJsonParse } from './aiClient';

export interface MatchedJobResult {
  matchScore: number;
  matchReasons: string[];
  missingSkills: string[];
  recommendedSkills: string[];
  confidenceScore: number;
  normalizedDescription: string;
  requiredSkills: string[];
  salaryFit: 'High' | 'Medium' | 'Low' | 'Unknown';
  locationFit: 'High' | 'Medium' | 'Low' | 'Unknown';
  experienceFit: 'High' | 'Medium' | 'Low' | 'Unknown';
  applicationPriority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const matchJobToProfile = async (job: any, profile: any): Promise<MatchedJobResult> => {
  const defaultResult: MatchedJobResult = {
    matchScore: 0,
    matchReasons: [],
    missingSkills: [],
    recommendedSkills: [],
    confidenceScore: 0.5,
    normalizedDescription: job.description || '',
    requiredSkills: [],
    salaryFit: 'Unknown',
    locationFit: 'Unknown',
    experienceFit: 'Unknown',
    applicationPriority: 'MEDIUM',
  };

  try {
    const prompt = `
You are an expert AI recruiter. Evaluate this job opportunity against the candidate profile.

CANDIDATE PROFILE:
- Primary Role: ${profile.primaryRole || 'Software Engineer'}
- Secondary Role: ${profile.secondaryRole || ''}
- Seniority: ${profile.seniority || 'Not specified'}
- Years of Experience: ${profile.yearsOfExperience || 'Not specified'}
- Core Skills: ${(profile.skills || []).join(', ')}
- Salary Expectation: ${profile.salaryExpectation ? `$${profile.salaryExpectation.toLocaleString()} / year` : 'Not specified'}
- Remote Preference: ${profile.remotePreference || 'Any'}
- Preferred Countries: ${(profile.preferredCountries || []).join(', ') || 'Any'}
- Preferred Cities: ${(profile.preferredCities || []).join(', ') || 'Any'}
- Career Memory: ${profile.memoryContext || ''}

JOB LISTING:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Remote Status: ${job.remoteStatus || 'Unknown'}
- Employment Type: ${job.employmentType || 'Unknown'}
- Salary: ${job.salary || 'Not listed'}
- Description:
---
${(job.description || '').slice(0, 2000)}
---

EVALUATION CRITERIA:
1. matchScore (0-100): Overall alignment between candidate and job.
2. matchReasons: 2-4 specific reasons why this is a strong match.
3. missingSkills: Skills the job requires but candidate doesn't have.
4. recommendedSkills: Additional skills that would make the candidate a stronger fit.
5. confidenceScore (0.0-1.0): How confident you are in this evaluation.
6. normalizedDescription: A concise 2-3 sentence summary of key responsibilities and requirements.
7. requiredSkills: Specific technical skills extracted from the job description.
8. salaryFit: "High" (meets/exceeds expectation), "Medium" (close), "Low" (well below), "Unknown" (not listed).
9. locationFit: "High" (exact match with preferences), "Medium" (partial), "Low" (mismatch), "Unknown".
10. experienceFit: "High" (perfect seniority match), "Medium" (close), "Low" (significant mismatch), "Unknown".
11. applicationPriority: "HIGH" (matchScore >= 80 and no major gaps), "MEDIUM" (60-79), "LOW" (< 60).

Return ONLY a JSON object:
{
  "matchScore": 85,
  "matchReasons": ["string"],
  "missingSkills": ["string"],
  "recommendedSkills": ["string"],
  "confidenceScore": 0.85,
  "normalizedDescription": "string",
  "requiredSkills": ["string"],
  "salaryFit": "High",
  "locationFit": "High",
  "experienceFit": "Medium",
  "applicationPriority": "HIGH"
}
`;

    const response = await aiProvider.chat(
      [
        { role: 'system', content: 'You are an expert AI recruiter. Return structured JSON match analytics only.' },
        { role: 'user', content: prompt },
      ],
      { jsonMode: true, maxTokens: 1200 }
    );

    const parsed = safeJsonParse(response);
    if (!parsed) {
      console.warn('[JobMatcher] Could not parse AI response, using defaults.');
      return defaultResult;
    }

    return {
      matchScore: typeof parsed.matchScore === 'number' ? parsed.matchScore : 0,
      matchReasons: Array.isArray(parsed.matchReasons) ? parsed.matchReasons : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      recommendedSkills: Array.isArray(parsed.recommendedSkills) ? parsed.recommendedSkills : [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.5,
      normalizedDescription: parsed.normalizedDescription || job.description || '',
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
      salaryFit: parsed.salaryFit || 'Unknown',
      locationFit: parsed.locationFit || 'Unknown',
      experienceFit: parsed.experienceFit || 'Unknown',
      applicationPriority: parsed.applicationPriority || 'MEDIUM',
    };
  } catch (err) {
    console.error('[JobMatcher] Error matching job to profile:', err);
    return defaultResult;
  }
};
