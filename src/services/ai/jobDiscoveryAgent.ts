import { aiProvider, safeJsonParse } from './aiClient';
import { JOB_DISCOVERY_SYSTEM_PROMPT } from './prompts';

export const discoverJobs = async (resumeData: any) => {
  const prompt = `
  CANDIDATE MASTER RESUME:
  ${JSON.stringify(resumeData, null, 2)}
  
  Please generate 4-5 relevant job opportunities for this candidate based on their master resume details.
  `;

  try {
    const content = await aiProvider.chat([
      { role: 'system', content: JOB_DISCOVERY_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ], {
      jsonMode: true,
      maxTokens: 2000
    });

    const parsed = safeJsonParse(content);
    if (parsed && parsed.jobs) return parsed.jobs;

    console.warn('[JobDiscoveryAgent] Could not parse AI response, returning empty jobs list.');
    return [];
  } catch (error) {
    console.error('Error in jobDiscoveryAgent:', error);
    throw new Error('Failed to discover relevant jobs');
  }
};
