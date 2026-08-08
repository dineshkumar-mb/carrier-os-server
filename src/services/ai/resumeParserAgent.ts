import { aiProvider, safeJsonParse } from './aiClient';
import { RESUME_PARSER_SYSTEM_PROMPT } from './prompts';

export const parseResumeText = async (resumeText: string) => {
  const prompt = `
  RAW RESUME TEXT:
  ${resumeText}
  
  Please extract and structure this resume text into JSON format.
  `;

  try {
    const content = await aiProvider.chat([
      { role: 'system', content: RESUME_PARSER_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ], {
      jsonMode: true,
      maxTokens: 1500
    });

    const parsed = safeJsonParse(content);
    if (parsed) return parsed;

    // If safeJsonParse failed, return empty structure rather than crashing
    console.warn('[ResumeParser] Could not parse AI response, returning empty structure. Raw:', content.substring(0, 200));
    return { experience: [], education: [], skills: [], projects: [] };
  } catch (error) {
    console.error('Error in resumeParserAgent:', error);
    throw new Error('Failed to parse resume text using AI');
  }
};
