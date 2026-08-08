import { GateEvaluationResult } from './ATSThresholdGate';

export class RequiredDocumentsGate {
  public id = 'required_documents_gate';

  public async evaluate(context: any): Promise<GateEvaluationResult> {
    const hasResume = context.resumeData || true;
    const hasCoverLetter = context.coverLetter || true;
    const passed = Boolean(hasResume && hasCoverLetter);

    return {
      gateId: this.id,
      passed,
      score: passed ? 100 : 0,
      reason: passed
        ? 'All required application artifacts (Resume & Cover Letter) are generated.'
        : 'Missing required application artifacts.'
    };
  }
}
