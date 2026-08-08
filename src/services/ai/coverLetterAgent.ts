import { openRouterClient, DEFAULT_MODEL } from './aiClient';
import { COVER_LETTER_SYSTEM_PROMPT } from './prompts';

export const generateCoverLetter = async (tailoredResumeData: any, jobDescription: string) => {
  const prompt = `
  TAILORED RESUME:
  ${JSON.stringify(tailoredResumeData, null, 2)}
  
  TARGET JOB DESCRIPTION:
  ${jobDescription}
  
  Please output the cover letter in Markdown format.
  `;

  try {
    const response = await openRouterClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: COVER_LETTER_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in generateCoverLetter AI agent:', error);
    throw new Error('Failed to generate cover letter');
  }
};
