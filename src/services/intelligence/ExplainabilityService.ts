export interface DecisionExplainability {
  decisionId: string;
  jobId: string;
  companyName: string;
  roleTitle: string;
  action: 'AUTO_APPLY' | 'REQUEST_REVIEW' | 'REJECT';
  overallScore: number;
  breakdown: {
    matchScore: number;
    atsScore: number;
    riskScore: number;
    salaryFit: boolean;
    locationFit: boolean;
    policyMode: 'Manual' | 'Assisted' | 'Automatic';
  };
  ruleEvaluations: Array<{
    rule: string;
    passed: boolean;
    detail: string;
  }>;
  rationale: string;
  timestamp: string;
}

export class ExplainabilityService {
  private static instance: ExplainabilityService;
  private logs: Map<string, DecisionExplainability> = new Map();

  private constructor() {}

  public static getInstance(): ExplainabilityService {
    if (!ExplainabilityService.instance) {
      ExplainabilityService.instance = new ExplainabilityService();
    }
    return ExplainabilityService.instance;
  }

  public recordDecision(explanation: DecisionExplainability): DecisionExplainability {
    this.logs.set(explanation.decisionId, explanation);
    return explanation;
  }

  public getDecision(decisionId: string): DecisionExplainability | undefined {
    return this.logs.get(decisionId);
  }

  public getAllDecisions(): DecisionExplainability[] {
    return Array.from(this.logs.values());
  }

  public generateRationale(
    action: 'AUTO_APPLY' | 'REQUEST_REVIEW' | 'REJECT',
    matchScore: number,
    atsScore: number,
    riskScore: number,
    policyMode: string
  ): string {
    if (action === 'AUTO_APPLY') {
      return `Decision: AUTO_APPLY because Match Score (${matchScore}) >= 85, ATS Score (${atsScore}) >= 90, Risk Score (${riskScore}) <= 20 under ${policyMode} policy rules.`;
    } else if (action === 'REQUEST_REVIEW') {
      return `Decision: REQUEST_REVIEW because Policy Mode is '${policyMode}' requiring explicit human confirmation before form submission.`;
    } else {
      return `Decision: REJECT because Match Score (${matchScore}) or ATS Score (${atsScore}) fell below policy execution thresholds.`;
    }
  }
}
