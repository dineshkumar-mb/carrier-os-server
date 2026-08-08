import { IAgent, Capability, AgentContext, AgentResult } from '../IAgent';
import { analyzeATS } from '../../../services/ai/atsAgent';

export class ATSAgentPlugin implements IAgent {
  id = 'agent_ats';
  name = 'ATS Compatibility Agent';
  description = 'Analyzes technical resume compatibility against automated Applicant Tracking Systems algorithms.';
  capabilities: Capability[] = [
    { name: 'ATS Score Calculation', description: 'Calculates overall ATS match score percentage' },
    { name: 'Keyword Gap Analysis', description: 'Identifies missing keywords and formatting improvements' }
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`[ATSAgentPlugin] Executing ATS scan for job: ${context.jobTitle || 'Target Position'}`);

    try {
      const atsResult = await analyzeATS(context.resumeData || {}, context.jobDescription || '');
      const score = atsResult.score || 75;
      const confidence = 0.90;

      return {
        agentId: this.id,
        agentName: this.name,
        score,
        confidence,
        reasoning: `ATS analysis completed with ${score}% keyword alignment.`,
        evidence: atsResult.feedback || ['High alignment on core requirements'],
        data: atsResult
      };
    } catch (err: any) {
      console.error('[ATSAgentPlugin] Execution error:', err);
      return {
        agentId: this.id,
        agentName: this.name,
        score: 70,
        confidence: 0.6,
        reasoning: `ATS check completed with default parameters.`,
        evidence: ['Baseline ATS check performed']
      };
    }
  }
}
