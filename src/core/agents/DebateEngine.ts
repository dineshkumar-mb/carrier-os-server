import { AgentResult } from './IAgent';

export interface MultiAgentDebateOutcome {
  consensusScore: number; // 0 - 100
  overallConfidence: number; // 0.0 - 1.0
  interviewProbability: number; // 0 - 100%
  offerProbability: number; // 0 - 100%
  recruiterScore: number;
  hiringManagerScore: number;
  atsScore: number;
  salaryScore: number;
  decision: 'APPLY' | 'REVIEW' | 'REJECT';
  synthesisReasoning: string;
  keyEvidences: string[];
  agentBreakdown: Record<string, { score: number; confidence: number; reasoning: string }>;
}

export class DebateEngine {
  public synthesizeDebate(results: AgentResult[]): MultiAgentDebateOutcome {
    if (!results || results.length === 0) {
      return {
        consensusScore: 50,
        overallConfidence: 0.5,
        interviewProbability: 35,
        offerProbability: 15,
        recruiterScore: 50,
        hiringManagerScore: 50,
        atsScore: 50,
        salaryScore: 50,
        decision: 'REVIEW',
        synthesisReasoning: 'Insufficient agent results for consensus debate.',
        keyEvidences: [],
        agentBreakdown: {}
      };
    }

    let weightedScoreSum = 0;
    let confidenceSum = 0;
    const agentBreakdown: Record<string, { score: number; confidence: number; reasoning: string }> = {};
    const keyEvidences: string[] = [];

    let recruiterScore = 70;
    let hiringManagerScore = 70;
    let atsScore = 70;
    let salaryScore = 70;

    for (const res of results) {
      const weight = Math.max(res.confidence || 0.5, 0.1);
      weightedScoreSum += res.score * weight;
      confidenceSum += weight;

      agentBreakdown[res.agentId] = {
        score: res.score,
        confidence: res.confidence,
        reasoning: res.reasoning
      };

      if (res.evidence && Array.isArray(res.evidence)) {
        keyEvidences.push(...res.evidence);
      }

      if (res.agentId === 'agent_recruiter') recruiterScore = res.score;
      if (res.agentId === 'agent_hiring_manager') hiringManagerScore = res.score;
      if (res.agentId === 'agent_ats') atsScore = res.score;
      if (res.agentId === 'agent_salary') salaryScore = res.score;
    }

    const consensusScore = Math.round(weightedScoreSum / (confidenceSum || 1));
    const overallConfidence = parseFloat((confidenceSum / results.length).toFixed(2));

    // Calculate Interview & Offer Probabilities using multi-perspective weights
    // Interview Probability = 0.35 * ATS + 0.35 * Recruiter + 0.30 * HiringManager
    const interviewProbability = Math.min(
      98,
      Math.max(5, Math.round(0.35 * atsScore + 0.35 * recruiterScore + 0.30 * hiringManagerScore))
    );

    // Offer Probability = 0.40 * HiringManager + 0.30 * Recruiter + 0.30 * Salary
    const offerProbability = Math.min(
      95,
      Math.max(2, Math.round(0.40 * hiringManagerScore + 0.30 * recruiterScore + 0.30 * salaryScore - 15))
    );

    let decision: 'APPLY' | 'REVIEW' | 'REJECT' = 'REVIEW';
    if (consensusScore >= 75 && interviewProbability >= 60) {
      decision = 'APPLY';
    } else if (consensusScore < 50) {
      decision = 'REJECT';
    }

    const synthesisReasoning = `Confidence-weighted debate score: ${consensusScore}% (Confidence: ${(overallConfidence * 100).toFixed(0)}%). Recruiter: ${recruiterScore}%, Engineering Lead: ${hiringManagerScore}%, ATS: ${atsScore}%. Projected Interview Probability: ${interviewProbability}%.`;

    return {
      consensusScore,
      overallConfidence,
      interviewProbability,
      offerProbability,
      recruiterScore,
      hiringManagerScore,
      atsScore,
      salaryScore,
      decision,
      synthesisReasoning,
      keyEvidences: Array.from(new Set(keyEvidences)).slice(0, 6),
      agentBreakdown
    };
  }
}

export const debateEngine = new DebateEngine();
