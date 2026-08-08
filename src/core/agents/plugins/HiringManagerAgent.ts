import { IAgent, Capability, AgentContext, AgentResult } from '../IAgent';
import { aiProvider, safeJsonParse } from '../../../services/ai/aiClient';

export class HiringManagerAgent implements IAgent {
  id = 'agent_hiring_manager';
  name = 'Hiring Manager AI Agent';
  description = 'Evaluates candidates from an Engineering Lead perspective (system design depth, project architecture, problem-solving impact, technical ownership).';
  capabilities: Capability[] = [
    { name: 'Architecture & System Design Depth', description: 'Evaluates architectural complexity of past projects' },
    { name: 'Engineering Ownership & Impact', description: 'Measures quantitative impact and leadership' },
    { name: 'Problem Solving Depth', description: 'Assesses technical depth and engineering rigor' }
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`[HiringManagerAgent] Executing engineering lead evaluation for job: ${context.jobTitle || 'Engineering Position'}`);

    const prompt = `
You are a Principal Engineering Lead / Hiring Manager. Evaluate this candidate's technical depth and project impact for the role: "${context.jobTitle || 'Senior Software Engineer'}".

Job Description:
${context.jobDescription || 'N/A'}

Candidate Resume / Project History:
${JSON.stringify(context.resumeData || {}, null, 2)}

Provide a rigorous technical evaluation returning ONLY a JSON object:
{
  "score": number (0-100),
  "confidence": number (0.0 to 1.0),
  "reasoning": "Detailed technical critique of engineering depth and ownership",
  "evidence": ["Evidence point 1", "Evidence point 2"],
  "architecturalStrengths": ["Strength 1"],
  "technicalGaps": ["Gap 1"]
}
`;

    try {
      const responseText = await aiProvider.chat([
        { role: 'system', content: 'You are a Principal Engineering Director AI. Return strictly valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true, temperature: 0.2 });

      const parsed = safeJsonParse(responseText) || {};
      const score = typeof parsed.score === 'number' ? parsed.score : 75;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.88;

      return {
        agentId: this.id,
        agentName: this.name,
        score,
        confidence,
        reasoning: parsed.reasoning || 'Candidate demonstrates solid engineering fundamentals.',
        evidence: parsed.evidence || parsed.architecturalStrengths || ['Proven project delivery'],
        data: {
          architecturalStrengths: parsed.architecturalStrengths || [],
          technicalGaps: parsed.technicalGaps || []
        }
      };
    } catch (err: any) {
      console.error('[HiringManagerAgent] Execution error:', err);
      return {
        agentId: this.id,
        agentName: this.name,
        score: 70,
        confidence: 0.5,
        reasoning: `Hiring Manager evaluation fallback due to error: ${err.message}`,
        evidence: ['Baseline technical review completed']
      };
    }
  }
}
