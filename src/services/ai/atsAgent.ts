import { aiProvider, safeJsonParse } from './aiClient';
import { ATS_ANALYZER_SYSTEM_PROMPT } from './prompts';

export const analyzeATS = async (resumeData: any, jobDescription: string) => {
  const prompt = `
  TAILORED RESUME:
  ${JSON.stringify(resumeData, null, 2)}
  
  TARGET JOB DESCRIPTION:
  ${jobDescription}
  
  Please output the ATS analysis strictly as JSON.
  `;

  try {
    const content = await aiProvider.chat([
      { role: 'system', content: ATS_ANALYZER_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ], {
      jsonMode: true,
      maxTokens: 750
    });

    const parsed = safeJsonParse(content);
    if (parsed) return parsed;

    console.warn('[ATSAgent] Could not parse AI response, returning fallback.');
    return { score: 0, feedback: ['Analysis response was incomplete'] };
  } catch (error) {
    console.error('Error in atsAgent:', error);
    return { score: 0, feedback: ['Analysis failed'] };
  }
};
