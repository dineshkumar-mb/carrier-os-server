import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class ApplicationPreparationWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'application_preparation_workflow',
    name: 'Application Preparation & Document Generation Workflow',
    description: 'Generates evidence-mapped tailored resume, validates truthfulness, calculates composite ATS score, creates cover letter, and generates safe browser execution plan.',
    requiredCapabilities: ['Resume Tailoring', 'Truthfulness Audit', 'ATS Optimization', 'Cover Letter Writer', 'Browser Automation'],
    qualityGates: ['ResumeTruthfulnessGate', 'ATSThresholdGate', 'RiskScoreGate'],
    policyModesAllowed: ['MANUAL', 'ASSISTED', 'AUTOMATIC']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'node_tailor_resume',
        taskName: 'Tailor Master Resume to Verified JD',
        agentId: 'resume_tailoring_agent',
        dependencies: [],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_verify_truthfulness',
        taskName: 'Audit Resume Claims Against Master Resume Facts',
        agentId: 'resume_intelligence_agent',
        dependencies: ['node_tailor_resume'],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_optimize_ats',
        taskName: 'Calculate Composite ATS Score & Formatting',
        agentId: 'ats_optimization_agent',
        dependencies: ['node_verify_truthfulness'],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_generate_cover_letter',
        taskName: 'Generate Consistent Cover Letter Artifact',
        agentId: 'cover_letter_agent',
        dependencies: ['node_optimize_ats'],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_generate_browser_plan',
        taskName: 'Generate Declarative Browser Execution Plan',
        agentId: 'browser_automation_agent',
        dependencies: ['node_generate_cover_letter'],
        status: 'pending',
        maxRetries: 0
      }
    ];
  }
}
