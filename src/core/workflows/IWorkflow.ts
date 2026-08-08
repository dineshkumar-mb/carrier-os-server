import { DAGNode } from '../runtime/Scheduler';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  requiredCapabilities: string[];
  qualityGates: string[];
  policyModesAllowed: string[];
}

export interface IWorkflow {
  definition: WorkflowDefinition;
  buildDAG(context: any): DAGNode[];
}
