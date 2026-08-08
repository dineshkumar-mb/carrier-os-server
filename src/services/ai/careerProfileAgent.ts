import { aiProvider, cleanJsonString } from './aiClient';
import { CareerProfile } from '../../models/CareerProfile';
import { Resume } from '../../models/Resume';

export const extractCareerProfile = async (userId: string): Promise<any> => {
  try {
    const resume = await Resume.findOne({ userId });
    if (!resume) throw new Error('Master resume not found for user');

    const prompt = `
    Master Resume Details:
    ${JSON.stringify({
      skills: resume.skills,
      experience: resume.experience,
      projects: resume.projects,
      education: resume.education
    }, null, 2)}
    
    Analyze the candidate's resume and extract their career profile.
    Return ONLY a JSON object matching this schema:
    {
      "primaryRole": "string (e.g. Frontend Engineer, Full Stack Developer, Data Scientist)",
      "secondaryRole": "string (e.g. UI Engineer, Backend Developer)",
      "seniority": "string (Junior | Mid | Senior | Lead | Manager)",
      "experience": "string (e.g. 5+ years)",
      "skills": ["string"],
      "preferredIndustries": ["string"],
      "preferredTechStack": ["string"],
      "remotePreference": "string (Remote | Onsite | Hybrid)",
      "salaryExpectation": number
    }
    `;

    const systemPrompt = `You are a professional recruiting analyst. Analyze the resume details and output a structured profile JSON. Do NOT output anything other than raw valid JSON.`;

    const response = await aiProvider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { jsonMode: true });

    const cleaned = cleanJsonString(response);
    const parsed = JSON.parse(cleaned);

    const profile = await CareerProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          primaryRole: parsed.primaryRole,
          secondaryRole: parsed.secondaryRole,
          seniority: parsed.seniority,
          experience: parsed.experience,
          skills: parsed.skills || [],
          preferredIndustries: parsed.preferredIndustries || [],
          preferredTechStack: parsed.preferredTechStack || [],
          remotePreference: parsed.remotePreference || 'Remote',
          salaryExpectation: parsed.salaryExpectation || 0
        }
      },
      { new: true, upsert: true }
    );

    return profile;
  } catch (error) {
    console.error('Error extracting career profile:', error);
    throw error;
  }
};
