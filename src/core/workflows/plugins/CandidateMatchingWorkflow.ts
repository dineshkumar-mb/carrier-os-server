import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class CandidateMatchingWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'candidate_matching_workflow',
    name: 'Candidate Job Suitability & Matching Workflow',
    description: 'Evaluates candidate fit against verified canonical job records across skill, experience, location, and salary dimensions.',
    requiredCapabilities: ['Match Scoring', 'Probability Estimator'],
    qualityGates: ['CompanyValidationGate'],
    policyModesAllowed: ['MANUAL', 'ASSISTED', 'AUTOMATIC']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'node_candidate_matching',
        taskName: 'Evaluate Candidate Multi-Dimensional Fit',
        agentId: 'ai_matching_agent',
        dependencies: [],
        status: 'pending',
        maxRetries: 0
      }
    ];
  }
}
