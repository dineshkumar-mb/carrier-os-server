import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class JobVerificationWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'job_verification_workflow',
    name: 'Job Authenticity & Verification Workflow',
    description: 'Multi-stage verification pipeline validating job URLs, official company domains, ATS requisition listings, freshness, and risk signals.',
    requiredCapabilities: ['URL Validator', 'Company Domain Verifier', 'ATS Scanner', 'Scam Risk Analyzer', 'AI Synthesizer'],
    qualityGates: ['JobAuthenticityGate', 'CompanyValidationGate'],
    policyModesAllowed: ['MANUAL', 'ASSISTED', 'AUTOMATIC']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'node_validate_job',
        taskName: 'Validate Basic Canonical Job Record',
        agentId: 'job_verification_agent',
        dependencies: [],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_verify_url',
        taskName: 'Verify Application URL & Redirect Chain',
        agentId: 'job_verification_agent',
        dependencies: ['node_validate_job'],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_verify_company',
        taskName: 'Verify Official Company Careers & ATS Domain',
        agentId: 'company_intelligence_agent',
        dependencies: ['node_validate_job'],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_verify_freshness',
        taskName: 'Check Job Active Status & Freshness Window',
        agentId: 'job_verification_agent',
        dependencies: ['node_validate_job'],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_cross_source_check',
        taskName: 'Check Independent Cross-Source Confirmation',
        agentId: 'job_discovery_agent',
        dependencies: ['node_verify_company', 'node_verify_url'],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_risk_analysis',
        taskName: 'Analyze Scam, Fee & Credential Risk Signals',
        agentId: 'job_verification_agent',
        dependencies: ['node_verify_company', 'node_verify_freshness'],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_ai_verification',
        taskName: 'Synthesize Evidence & Explain Observations',
        agentId: 'job_verification_agent',
        dependencies: ['node_cross_source_check', 'node_risk_analysis'],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_authenticity_gate',
        taskName: 'Evaluate Deterministic Authenticity Gate',
        agentId: 'job_verification_agent',
        dependencies: ['node_ai_verification'],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_persist_verification',
        taskName: 'Persist Global Verification & User Context',
        agentId: 'job_verification_agent',
        dependencies: ['node_authenticity_gate'],
        status: 'pending',
        maxRetries: 0
      }
    ];
  }
}
