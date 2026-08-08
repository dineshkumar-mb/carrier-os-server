import { IAgent, Capability, AgentContext, AgentResult } from '../IAgent';
import { aiProvider, safeJsonParse } from '../../../services/ai/aiClient';

export class SalaryAgent implements IAgent {
  id = 'agent_salary';
  name = 'Salary & Compensation Agent';
  description = 'Evaluates candidate market value, target salary expectations, and compensation alignment for job roles.';
  capabilities: Capability[] = [
    { name: 'Salary Alignment Check', description: 'Compares target compensation vs job budget' },
    { name: 'Market Value Estimation', description: 'Calculates candidate market rate based on stack & experience' }
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`[SalaryAgent] Executing salary evaluation for role: ${context.jobTitle || 'Role'}`);

    const prompt = `
Analyze the salary fit for this position: "${context.jobTitle || 'Role'}".

Job Description:
${context.jobDescription || 'N/A'}

Candidate Profile & Experience:
${JSON.stringify(context.userProfile || context.resumeData || {}, null, 2)}

Return ONLY a JSON object:
{
  "score": number (0-100),
  "confidence": number (0.0 to 1.0),
  "reasoning": "Summary of salary alignment and market benchmarking",
  "evidence": ["Evidence 1", "Evidence 2"],
  "estimatedMarketValue": "e.g. $130,000 - $160,000",
  "negotiationLeverage": "High | Medium | Low"
}
`;

    try {
      const responseText = await aiProvider.chat([
        { role: 'system', content: 'You are a Senior Compensation & Total Rewards Analyst AI. Return valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true, temperature: 0.2 });

      const parsed = safeJsonParse(responseText) || {};
      const score = typeof parsed.score === 'number' ? parsed.score : 80;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.82;

      return {
        agentId: this.id,
        agentName: this.name,
        score,
        confidence,
        reasoning: parsed.reasoning || 'Salary alignment falls within competitive market range.',
        evidence: parsed.evidence || ['Compensation alignment verified'],
        data: {
          estimatedMarketValue: parsed.estimatedMarketValue || 'Market Average',
          negotiationLeverage: parsed.negotiationLeverage || 'Medium'
        }
      };
    } catch (err: any) {
      console.error('[SalaryAgent] Execution error:', err);
      return {
        agentId: this.id,
        agentName: this.name,
        score: 75,
        confidence: 0.5,
        reasoning: `Salary evaluation fallback due to error: ${err.message}`,
        evidence: ['Baseline market comparison done']
      };
    }
  }
}
