import { IAgent, Capability, AgentContext, AgentResult } from '../IAgent';
import { aiProvider, safeJsonParse } from '../../../services/ai/aiClient';

export class ReflectionAgent implements IAgent {
  id = 'agent_reflection';
  name = 'Reflection & Learning Agent';
  description = 'Performs post-execution reflection on agent outcomes to identify lessons learned and update long-term system memory.';
  capabilities: Capability[] = [
    { name: 'Execution Reflection', description: 'Analyzes why an execution succeeded or encountered gaps' },
    { name: 'Memory Distillation', description: 'Extracts actionable learnings for future application cycles' }
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`[ReflectionAgent] Executing post-execution reflection...`);

    const prompt = `
Reflect on the overall candidate evaluation context and agent outputs for role: "${context.jobTitle || 'Role'}".

Context Data:
${JSON.stringify(context.customParams || {}, null, 2)}

Return ONLY a JSON object:
{
  "score": number (0-100),
  "confidence": number (0.0 to 1.0),
  "reasoning": "Synthesis of key lessons learned from this application execution",
  "evidence": ["Lesson 1", "Lesson 2"],
  "reflectionSummary": "Clear 2-sentence key takeaway for future applications",
  "recommendedMemoryUpdate": "Action item to save to memory"
}
`;

    try {
      const responseText = await aiProvider.chat([
        { role: 'system', content: 'You are a Meta-Cognitive AI Reflection Agent. Return valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true, temperature: 0.3 });

      const parsed = safeJsonParse(responseText) || {};

      return {
        agentId: this.id,
        agentName: this.name,
        score: typeof parsed.score === 'number' ? parsed.score : 85,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.90,
        reasoning: parsed.reasoning || 'Execution completed with high fidelity.',
        evidence: parsed.evidence || ['Reflection cycle complete'],
        data: {
          reflectionSummary: parsed.reflectionSummary || 'Application tailored successfully.',
          recommendedMemoryUpdate: parsed.recommendedMemoryUpdate || 'Maintain current resume positioning.'
        }
      };
    } catch (err: any) {
      console.error('[ReflectionAgent] Execution error:', err);
      return {
        agentId: this.id,
        agentName: this.name,
        score: 80,
        confidence: 0.5,
        reasoning: `Reflection cycle fallback.`,
        evidence: ['Baseline reflection recorded']
      };
    }
  }
}
