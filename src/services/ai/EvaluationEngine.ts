export interface EvaluationRules {
  minScore?: number;
  minConfidence?: number;
  requiredFields?: string[];
}

export class EvaluationEngine {
  public static evaluateOutput(data: any, rules: EvaluationRules): { passed: boolean; score: number; feedback: string } {
    if (!data) {
      return { passed: false, score: 0, feedback: 'Output data is empty or null' };
    }

    let pass = true;
    const feedback: string[] = [];

    if (rules.requiredFields) {
      for (const field of rules.requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          pass = false;
          feedback.push(`Missing required field: ${field}`);
        }
      }
    }

    if (typeof rules.minConfidence === 'number' && typeof data.confidence === 'number') {
      if (data.confidence < rules.minConfidence) {
        pass = false;
        feedback.push(`Confidence score (${data.confidence}) is below threshold (${rules.minConfidence})`);
      }
    }

    if (typeof rules.minScore === 'number' && typeof data.score === 'number') {
      if (data.score < rules.minScore) {
        feedback.push(`Score (${data.score}) is below expected minimum (${rules.minScore})`);
      }
    }

    return {
      passed: pass,
      score: typeof data.score === 'number' ? data.score : 70,
      feedback: feedback.length > 0 ? feedback.join('; ') : 'Output passed evaluation rules.'
    };
  }
}
