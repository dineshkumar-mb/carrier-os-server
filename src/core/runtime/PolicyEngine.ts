export type PolicyMode = 'Manual' | 'Assisted' | 'Automatic';

export interface PolicyRule {
  id: string;
  name: string;
  condition: string; // e.g. "MatchScore >= 85 AND ATSScore >= 90 AND RiskScore <= 20"
  action: 'AUTO_APPLY' | 'REQUEST_REVIEW' | 'REJECT';
  enabled: boolean;
}

export interface PolicyConfig {
  userId: string;
  mode: PolicyMode;
  minSalaryTarget: number;
  atsScoreThreshold: number;
  maxRiskScore: number;
  rules: PolicyRule[];
}

export class PolicyEngine {
  private static instance: PolicyEngine;
  private configs: Map<string, PolicyConfig> = new Map();

  private constructor() {
    this.seedDefaultConfig('default-user');
  }

  public static getInstance(): PolicyEngine {
    if (!PolicyEngine.instance) {
      PolicyEngine.instance = new PolicyEngine();
    }
    return PolicyEngine.instance;
  }

  private seedDefaultConfig(userId: string) {
    this.configs.set(userId, {
      userId,
      mode: 'Assisted',
      minSalaryTarget: 130000,
      atsScoreThreshold: 90,
      maxRiskScore: 20,
      rules: [
        {
          id: 'rule-auto-1',
          name: 'High Match Auto Apply',
          condition: 'MatchScore >= 85 AND ATSScore >= 90 AND RiskScore <= 20',
          action: 'AUTO_APPLY',
          enabled: true
        },
        {
          id: 'rule-review-1',
          name: 'Assisted Review Gate',
          condition: 'PolicyMode == Assisted',
          action: 'REQUEST_REVIEW',
          enabled: true
        }
      ]
    });
  }

  public getConfig(userId: string): PolicyConfig {
    if (!this.configs.has(userId)) {
      this.seedDefaultConfig(userId);
    }
    return this.configs.get(userId)!;
  }

  public updateConfig(userId: string, partial: Partial<PolicyConfig>): PolicyConfig {
    const existing = this.getConfig(userId);
    const updated = { ...existing, ...partial };
    this.configs.set(userId, updated);
    return updated;
  }

  public evaluatePolicy(userId: string, matchScore: number, atsScore: number, riskScore: number): {
    action: 'AUTO_APPLY' | 'REQUEST_REVIEW' | 'REJECT';
    policyMode: PolicyMode;
    rationale: string;
  } {
    const config = this.getConfig(userId);

    if (config.mode === 'Manual') {
      return {
        action: 'REQUEST_REVIEW',
        policyMode: config.mode,
        rationale: 'Policy Mode is set to Manual. Every application requires explicit user review.'
      };
    }

    if (config.mode === 'Automatic' && matchScore >= 85 && atsScore >= config.atsScoreThreshold && riskScore <= config.maxRiskScore) {
      return {
        action: 'AUTO_APPLY',
        policyMode: config.mode,
        rationale: `Automatic policy satisfied: Match Score (${matchScore}) >= 85, ATS Score (${atsScore}) >= ${config.atsScoreThreshold}, Risk Score (${riskScore}) <= ${config.maxRiskScore}.`
      };
    }

    return {
      action: 'REQUEST_REVIEW',
      policyMode: config.mode,
      rationale: `Policy Mode is set to ${config.mode}. Application routed to Human Approval Queue for user confirmation.`
    };
  }
}
