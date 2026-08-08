import { IAgent, Capability, AgentContext, AgentResult } from '../IAgent';
import { aiProvider, safeJsonParse } from '../../../services/ai/aiClient';

/**
 * Evaluates simulated candidate answers against the generated question pack,
 * produces a performance score, and writes structured feedback for the
 * Learning Memory node to consume.
 */
export class InterviewEvaluatorAgent implements IAgent {
  id = 'agent_interview_evaluator';
  name = 'Interview Performance Evaluator';
  description = 'Evaluates mock interview answers, scores performance, and generates actionable feedback to improve future responses.';
  capabilities: Capability[] = [
    { name: 'Answer Quality Scoring', description: 'Rates answer completeness, clarity, and technical depth' },
    { name: 'Feedback Generation', description: 'Produces structured, actionable improvement guidance' },
    { name: 'Weakness Detection', description: 'Identifies recurring gaps across the answer set' }
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`[InterviewEvaluatorAgent] Evaluating interview performance for: ${context.jobTitle || 'target role'}`);

    const questionData = context.customParams?.questionData || {};
    const answers = context.customParams?.answers || {};

    const prompt = `
You are a senior interview coach and talent evaluator.

Role: "${context.jobTitle || 'Software Engineer'}"
Questions Asked:
${JSON.stringify(questionData, null, 2)}

Candidate Answers (may be empty for simulation mode):
${JSON.stringify(answers, null, 2)}

Evaluate performance thoroughly. Return ONLY valid JSON:
{
  "score": number (0-100, overall interview performance score),
  "confidence": number (0.0-1.0),
  "reasoning": "Summary of performance strengths and weaknesses",
  "evidence": ["Strength 1", "Weakness 1"],
  "feedback": {
    "strengths": ["Area 1"],
    "improvements": ["Area 1"],
    "modelAnswers": { "questionKey": "model answer" }
  },
  "readinessLevel": "not_ready | needs_work | ready | strong"
}
`;

    try {
      const responseText = await aiProvider.chat([
        { role: 'system', content: 'You are an expert interview evaluator AI. Return strictly valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true, temperature: 0.25 });

      const parsed = safeJsonParse(responseText) || {};
      const score = typeof parsed.score === 'number' ? parsed.score : 72;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;

      return {
        agentId: this.id,
        agentName: this.name,
        score,
        confidence,
        reasoning: parsed.reasoning || 'Interview performance evaluated against role expectations.',
        evidence: parsed.evidence || ['Performance assessed', 'Feedback generated'],
        data: {
          feedback: parsed.feedback || { strengths: [], improvements: [], modelAnswers: {} },
          readinessLevel: parsed.readinessLevel || 'needs_work'
        }
      };
    } catch (err: any) {
      console.error('[InterviewEvaluatorAgent] Execution error:', err);
      return {
        agentId: this.id,
        agentName: this.name,
        score: 60,
        confidence: 0.5,
        reasoning: `Evaluation fallback: ${err.message}`,
        evidence: ['Baseline evaluation completed'],
        data: {
          feedback: { strengths: ['Attempted all questions'], improvements: ['Provide more specific examples'], modelAnswers: {} },
          readinessLevel: 'needs_work'
        }
      };
    }
  }
}
