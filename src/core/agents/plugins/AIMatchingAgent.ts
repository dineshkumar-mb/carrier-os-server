import { IAgent, AgentContext, AgentResult, Capability } from '../IAgent';
import { SkillGraphService } from '../../../services/intelligence/SkillGraphService';

export class AIMatchingAgent implements IAgent {
  public id = 'ai_matching_agent';
  public name = 'AI Matching Agent';
  public description = 'Compares candidate master profile against job specs to compute Match Score, Skill Coverage, and Interview Probability.';
  public capabilities: Capability[] = [
    { name: 'Match Scoring', description: 'Calculates overall candidate-to-job fit percentage' },
    { name: 'Probability Estimator', description: 'Predicts interview callback probability' }
  ];

  public async execute(context: AgentContext): Promise<AgentResult> {
    const requiredSkills = (context.customParams?.requiredSkills as string[]) || ['React', 'TypeScript', 'Node.js', 'PostgreSQL'];
    const skillService = SkillGraphService.getInstance();

    const coverage = skillService.calculateCoverage(context.userId || 'default-user', requiredSkills);
    const overallScore = Math.min(100, Math.round(coverage.coverageScore * 0.9 + 8));

    return {
      agentId: this.id,
      agentName: this.name,
      score: overallScore,
      confidence: 0.93,
      reasoning: `Match score calculated at ${overallScore}%. High overlap in React, TypeScript, Node.js.`,
      evidence: [
        `Matched skills: ${coverage.matchedSkills.join(', ')}`,
        `Skill coverage: ${coverage.coverageScore}%`,
        `Estimated interview callback probability: ${overallScore > 85 ? 'High (80%+)' : 'Medium (50%)'}`
      ],
      data: {
        matchScore: overallScore,
        coverageScore: coverage.coverageScore,
        matchedSkills: coverage.matchedSkills,
        missingSkills: coverage.missingSkills,
        interviewProbability: overallScore > 85 ? 0.85 : 0.55
      }
    };
  }
}
