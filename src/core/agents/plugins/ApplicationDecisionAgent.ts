import { IAgent, AgentContext, AgentResult, Capability } from '../IAgent';
import { ExplainabilityService } from '../../../services/intelligence/ExplainabilityService';

export class ApplicationDecisionAgent implements IAgent {
  public id = 'application_decision_agent';
  public name = 'Application Decision Agent';
  public description = 'Evaluates application match scores, ATS scores, and risk scores against user policy rules to decide action.';
  public capabilities: Capability[] = [
    { name: 'Policy Decision Engine', description: 'Evaluates Auto Apply, Request Review, or Reject' },
    { name: 'Explainability Generator', description: 'Produces audit trail rationales for user transparency' }
  ];

  public async execute(context: AgentContext): Promise<AgentResult> {
    const matchScore = context.customParams?.matchScore || 91;
    const atsScore = context.customParams?.atsScore || 94;
    const riskScore = context.customParams?.riskScore || 10;
    const policyMode = context.customParams?.policyMode || 'Assisted';

    let action: 'AUTO_APPLY' | 'REQUEST_REVIEW' | 'REJECT' = 'REQUEST_REVIEW';

    if (policyMode === 'Automatic' && matchScore >= 85 && atsScore >= 90 && riskScore <= 20) {
      action = 'AUTO_APPLY';
    } else if (matchScore < 60 || atsScore < 70) {
      action = 'REJECT';
    } else {
      action = 'REQUEST_REVIEW';
    }

    const explainability = ExplainabilityService.getInstance();
    const rationale = explainability.generateRationale(action, matchScore, atsScore, riskScore, policyMode);

    const decisionRecord = explainability.recordDecision({
      decisionId: `dec-${Date.now()}`,
      jobId: context.jobId || 'job-101',
      companyName: context.company || 'TechScale Inc',
      roleTitle: context.jobTitle || 'Senior Software Engineer',
      action,
      overallScore: Math.round((matchScore + atsScore) / 2),
      breakdown: {
        matchScore,
        atsScore,
        riskScore,
        salaryFit: true,
        locationFit: true,
        policyMode: policyMode as any
      },
      ruleEvaluations: [
        { rule: 'Match Score >= 85', passed: matchScore >= 85, detail: `Score was ${matchScore}` },
        { rule: 'ATS Score >= 90', passed: atsScore >= 90, detail: `Score was ${atsScore}` },
        { rule: 'Risk Score <= 20', passed: riskScore <= 20, detail: `Risk was ${riskScore}` },
        { rule: 'Policy Mode Evaluation', passed: action === 'AUTO_APPLY', detail: `Mode is ${policyMode}` }
      ],
      rationale,
      timestamp: new Date().toISOString()
    });

    return {
      agentId: this.id,
      agentName: this.name,
      score: decisionRecord.overallScore,
      confidence: 0.96,
      reasoning: rationale,
      evidence: [
        `Policy Mode: ${policyMode}`,
        `Action Determined: ${action}`
      ],
      data: decisionRecord
    };
  }
}
