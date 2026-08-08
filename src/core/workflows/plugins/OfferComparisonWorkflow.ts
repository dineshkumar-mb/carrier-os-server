import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class OfferComparisonWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'offer_comparison_workflow',
    name: 'Offer Comparison Workflow (Marketplace Plugin)',
    description: 'Compares base salary, equity vesting schedules, remote flexibility, and health benefits across multiple offers.',
    requiredCapabilities: ['Compensation Parser'],
    qualityGates: ['PolicyValidationGate'],
    policyModesAllowed: ['Manual', 'Assisted', 'Automatic']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'step_analyze_offers',
        taskName: 'Analyze Compensation Packages',
        agentId: 'company_intelligence_agent',
        dependencies: [],
        status: 'pending'
      }
    ];
  }
}
