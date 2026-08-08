import { openRouterClient, DEFAULT_MODEL, cleanJsonString } from './aiClient';
import { RESUME_TAILOR_SYSTEM_PROMPT } from './prompts';
import { CareerProfile } from '../../models/CareerProfile';

export const tailorResume = async (masterResumeData: any, jobDescription: string, userId?: string) => {
  let memoryGuidance = '';
  if (userId) {
    try {
      const profile = await CareerProfile.findOne({ userId });
      if (profile && profile.memoryContext) {
        memoryGuidance = `
        CRITICAL ATS OPTIMIZATION GUIDELINES (Based on previous application outcomes):
        ${profile.memoryContext}
        `;
      }
    } catch (e) {
      console.error('Error fetching career profile memory context:', e);
    }
  }

  const prompt = `
  MASTER RESUME:
  ${JSON.stringify(masterResumeData, null, 2)}
  
  TARGET JOB DESCRIPTION:
  ${jobDescription}
  
  ${memoryGuidance}
  
  Please output the tailored resume as JSON.
  `;

  try {
    const response = await openRouterClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: RESUME_TAILOR_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 3000
    });

    const content = response.choices[0]?.message?.content || '{}';
    const cleaned = cleanJsonString(content);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error in tailorResume AI agent:', error);
    throw new Error('Failed to generate tailored resume');
  }
};
