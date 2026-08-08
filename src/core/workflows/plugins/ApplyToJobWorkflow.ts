import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class ApplyToJobWorkflow implements IWorkflow {
  definition: WorkflowDefinition = {
    id: 'workflow_apply_job',
    name: 'End-to-End Apply to Job Workflow',
    description: 'Declarative workflow for evaluating job match, tailoring resume & cover letter, running quality gates, and policy-based application submission.',
    requiredCapabilities: ['experience', 'architecture', 'ats', 'salary', 'reflection'],
    qualityGates: ['gate_duplicate_check', 'gate_resume_ats', 'gate_risk_score'],
    policyModesAllowed: ['MANUAL', 'ASSISTED', 'AUTOMATIC']
  };

  buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'node_recruiter',
        taskName: 'HR Recruiter Screening',
        agentId: 'agent_recruiter',
        dependencies: [],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_hiring_manager',
        taskName: 'Engineering Lead Assessment',
        agentId: 'agent_hiring_manager',
        dependencies: [],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_ats',
        taskName: 'ATS Compliance Scan',
        agentId: 'agent_ats',
        dependencies: [],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_salary',
        taskName: 'Compensation & Salary Alignment',
        agentId: 'agent_salary',
        dependencies: [],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_reflection',
        taskName: 'Meta-Reflection & Outcome Memory',
        agentId: 'agent_reflection',
        dependencies: ['node_recruiter', 'node_hiring_manager', 'node_ats', 'node_salary'],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_browser_submit',
        taskName: 'Browser Form Submission',
        agentId: 'tool_browser', // Mapped to BrowserTool in ToolRegistry
        dependencies: ['node_reflection'],
        status: 'pending',
        maxRetries: 3, // BrowserTool gets 3 retries
        compensationAction: async () => {
          // Clean up any temp files generated before browser failure
          console.log('[Compensation] Cleaning up temp artifacts after browser failure...');
          if (context?.applicationId) {
            const { Application } = await import('../../../models/Application');
            await Application.findByIdAndUpdate(context.applicationId, {
              status: 'Application Failed',
              $push: { timeline: { status: 'Application Failed', timestamp: new Date(), note: 'Compensation: Browser submission exhausted retries.' } }
            }).catch(() => {});
          }
        }
      }
    ];
  }
}
