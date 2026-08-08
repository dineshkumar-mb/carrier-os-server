import { CareerProfile } from '../../models/CareerProfile';
import { Application } from '../../models/Application';
import { aiProvider } from './aiClient';

export const runLearningCycle = async (userId: string): Promise<string> => {
  try {
    const profile = await CareerProfile.findOne({ userId });
    if (!profile) return 'No career profile found.';

    const rejections = await Application.find({ userId, status: 'Rejected' }).populate('jobId');
    if (rejections.length === 0) {
      return 'No rejections found yet. System continues learning.';
    }

    const rejectionData = rejections.map((r: any) => ({
      jobTitle: r.jobId?.title,
      jobDescription: r.jobId?.description,
      skillsRequired: r.jobId?.skills
    }));

    const prompt = `
    Candidate Skills: ${JSON.stringify(profile.skills)}
    
    Rejected Applications Details:
    ${JSON.stringify(rejectionData, null, 2)}
    
    Analyze why these applications failed. Identify:
    1. Common missing skills or technologies required by the jobs that the candidate lacks.
    2. Suggested keywords or accomplishments the candidate should highlight in future resumes.
    
    Output a concise summary paragraph (under 150 words) that can be appended to the AI resume tailoring prompt to guide future optimization and avoid similar rejection patterns.
    `;

    const systemPrompt = `You are a senior technical recruiter analyzing candidate rejection patterns. Provide a concise context prompt for AI resume writers.`;

    const response = await aiProvider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);

    profile.memoryContext = response.trim();
    await profile.save();

    console.log(`[LearningEngine] Updated memory context for user ${userId}:`, profile.memoryContext);
    return profile.memoryContext;
  } catch (err) {
    console.error('Error in learning cycle:', err);
    return '';
  }
};
