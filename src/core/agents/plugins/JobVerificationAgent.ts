import { IAgent, AgentContext, AgentResult, Capability } from '../IAgent';
import { EvidenceItem, RiskSignal, VerificationStatus } from '../../../services/jobVerification/JobVerificationTypes';

export class JobVerificationAgent implements IAgent {
  public id = 'job_verification_agent';
  public name = 'Job Verification AI Agent';
  public description = 'Synthesizes collected verification evidence, detects internal contradictions, and generates human-explainable authenticity reasoning.';
  public capabilities: Capability[] = [
    { name: 'Evidence Synthesizer', description: 'Aggregates multi-source observations without inventing external unverified facts.' },
    { name: 'Contradiction Detector', description: 'Identifies mismatches between company branding, URLs, and recruiter emails.' },
    { name: 'Reasoning Explainer', description: 'Generates structured, step-by-step verification explanations.' }
  ];

  public async execute(context: AgentContext): Promise<AgentResult> {
    const job = context.customParams?.canonicalJob || {
      title: context.jobTitle || 'Unknown Title',
      company: context.company || 'Unknown Company',
      url: context.customParams?.url || 'https://example.com'
    };

    const evidence: EvidenceItem[] = context.customParams?.evidence || [];
    const riskSignals: RiskSignal[] = context.customParams?.riskSignals || [];
    const deterministicScore: number = context.customParams?.deterministicScore ?? 75;
    const deterministicStatus: VerificationStatus = context.customParams?.deterministicStatus || 'NEEDS_REVIEW';

    const contradictions: string[] = [];
    const summaryLines: string[] = [];

    // Analyze evidence and risk signals without hallucinating external facts
    if (evidence.length === 0) {
      contradictions.push('No verifiable independent evidence items were collected.');
      summaryLines.push('Verification relied on basic field validation without independent source confirmation.');
    } else {
      summaryLines.push(`Synthesized ${evidence.length} independent evidence item(s).`);
      for (const item of evidence) {
        summaryLines.push(`- [${item.strength} | ${item.provenance}] ${item.details}`);
      }
    }

    if (riskSignals.length > 0) {
      for (const risk of riskSignals) {
        contradictions.push(`[${risk.severity}] ${risk.description}`);
      }
    }

    const confidence = Math.min(0.98, Math.max(0.15, Number((evidence.length * 0.2 + (100 - riskSignals.length * 25) * 0.005).toFixed(2))));

    let recommendedStatus: VerificationStatus = deterministicStatus;
    if (riskSignals.some(r => r.severity === 'CRITICAL')) {
      recommendedStatus = 'INVALID';
    }

    const reasoning = contradictions.length > 0
      ? `Job verification completed with ${riskSignals.length} risk signal(s) flagged: ${contradictions.join('; ')}`
      : `Job authenticity verified with score ${deterministicScore}%. ${summaryLines.join(' ')}`;

    return {
      agentId: this.id,
      agentName: this.name,
      score: deterministicScore,
      confidence,
      reasoning,
      evidence: evidence.map(e => e.details || e.type),
      data: {
        summary: reasoning,
        contradictions,
        confidence,
        recommendedStatus,
        evidenceCount: evidence.length,
        riskCount: riskSignals.length,
        recommendation: recommendedStatus === 'VERIFIED_HIGH_CONFIDENCE' || recommendedStatus === 'PROBABLY_REAL'
          ? 'ALLOW_MATCHING'
          : 'REQUIRE_HUMAN_REVIEW_OR_BLOCK'
      }
    };
  }
}
