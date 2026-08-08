import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class CertificationPlannerWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'certification_planner_workflow',
    name: 'Certification Planner Workflow (Marketplace Plugin)',
    description: 'Recommends high-value industry certifications aligned with target role level and skill gaps.',
    requiredCapabilities: ['Course Recommendation'],
    qualityGates: ['ResumeQualityGate'],
    policyModesAllowed: ['Manual', 'Assisted', 'Automatic']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'step_plan_certifications',
        taskName: 'Plan Industry Certifications',
        agentId: 'learning_agent',
        dependencies: [],
        status: 'pending'
      }
    ];
  }
}
