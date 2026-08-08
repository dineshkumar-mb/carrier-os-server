import { openRouterClient, DEFAULT_MODEL, cleanJsonString } from './aiClient';
import { INTERVIEW_COACH_SYSTEM_PROMPT } from './prompts';

export const generateInterviewPrep = async (resumeData: any, jobDescription: string) => {
  const prompt = `
  CANDIDATE RESUME:
  ${JSON.stringify(resumeData, null, 2)}
  
  TARGET JOB DESCRIPTION:
  ${jobDescription}
  
  Please output the interview prep kit strictly as JSON.
  `;

  try {
    const response = await openRouterClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: INTERVIEW_COACH_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '{"questions":[]}';
    const cleaned = cleanJsonString(content);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error in interviewAgent:', error);
    throw new Error('Failed to generate interview prep');
  }
};
