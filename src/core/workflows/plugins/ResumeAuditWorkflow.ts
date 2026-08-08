import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class ResumeAuditWorkflow implements IWorkflow {
  definition: WorkflowDefinition = {
    id: 'workflow_resume_audit',
    name: 'Master Resume Health Audit Workflow',
    description: 'Audits canonical master resume for ATS score, weak sections, missing keywords, and concrete improvements.',
    requiredCapabilities: ['ats', 'experience', 'reflection'],
    qualityGates: ['gate_resume_ats'],
    policyModesAllowed: ['MANUAL', 'ASSISTED', 'AUTOMATIC']
  };

  buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'node_ats_audit',
        taskName: 'ATS Master Resume Audit',
        agentId: 'agent_ats',
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'node_recruiter_audit',
        taskName: 'HR Recruiter Master Audit',
        agentId: 'agent_recruiter',
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'node_reflection_audit',
        taskName: 'Audit Recommendations Synthesis',
        agentId: 'agent_reflection',
        dependencies: ['node_ats_audit', 'node_recruiter_audit'],
        status: 'pending'
      }
    ];
  }
}
