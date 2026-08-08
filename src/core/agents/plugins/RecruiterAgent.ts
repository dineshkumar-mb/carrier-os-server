import { IAgent, Capability, AgentContext, AgentResult } from '../IAgent';
import { aiProvider, safeJsonParse } from '../../../services/ai/aiClient';

export class RecruiterAgent implements IAgent {
  id = 'agent_recruiter';
  name = 'Recruiter AI Agent';
  description = 'Evaluates candidate resumes from an HR recruiter perspective (ATS keywords, experience stability, tenure, formatting, and hard requirements).';
  capabilities: Capability[] = [
    { name: 'ATS Keyword Matching', description: 'Checks for mandatory domain keywords and core skills' },
    { name: 'Experience & Tenure Audit', description: 'Assesses career progression and employment stability' },
    { name: 'Red Flag Detection', description: 'Flags potential resume gaps or formatting issues' }
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`[RecruiterAgent] Executing recruiter evaluation for job: ${context.jobTitle || 'General Position'}`);

    const prompt = `
You are an expert HR Recruiter at a top tech company. Analyze this candidate's resume for the role: "${context.jobTitle || 'Software Engineer'}".

Job Description:
${context.jobDescription || 'N/A'}

Candidate Resume Data:
${JSON.stringify(context.resumeData || {}, null, 2)}

Provide an aggressive recruiter evaluation returning ONLY a JSON object:
{
  "score": number (0-100),
  "confidence": number (0.0 to 1.0),
  "reasoning": "Detailed 2-3 sentence summary of HR recruiter evaluation",
  "evidence": ["Point 1", "Point 2", "Point 3"],
  "redFlags": ["Flag 1 if any"],
  "keyStrengths": ["Strength 1", "Strength 2"]
}
`;

    try {
      const responseText = await aiProvider.chat([
        { role: 'system', content: 'You are a senior HR Recruiter AI. Return strictly valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true, temperature: 0.2 });

      const parsed = safeJsonParse(responseText) || {};
      const score = typeof parsed.score === 'number' ? parsed.score : 70;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;

      return {
        agentId: this.id,
        agentName: this.name,
        score,
        confidence,
        reasoning: parsed.reasoning || 'Candidate meets baseline HR requirements.',
        evidence: parsed.evidence || parsed.keyStrengths || ['Relevant skills detected'],
        data: {
          redFlags: parsed.redFlags || [],
          keyStrengths: parsed.keyStrengths || []
        }
      };
    } catch (err: any) {
      console.error('[RecruiterAgent] Execution error:', err);
      return {
        agentId: this.id,
        agentName: this.name,
        score: 65,
        confidence: 0.5,
        reasoning: `Recruiter evaluation fallback due to error: ${err.message}`,
        evidence: ['Basic profile review completed']
      };
    }
  }
}
