import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class JobMarketIntelligenceWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'job_market_intelligence_workflow',
    name: 'Job Market Intelligence Workflow',
    description: 'Tracks market hiring trends, in-demand technologies, salary distributions, and company expansion/layoff signals.',
    requiredCapabilities: ['Market Intelligence', 'Trend Analysis'],
    qualityGates: ['CompanyValidationGate'],
    policyModesAllowed: ['Manual', 'Assisted', 'Automatic']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'step_scan_market_trends',
        taskName: 'Scan Market Trends',
        agentId: 'company_intelligence_agent',
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'step_aggregate_skill_demand',
        taskName: 'Aggregate Skill Demand',
        agentId: 'job_intelligence_agent',
        dependencies: ['step_scan_market_trends'],
        status: 'pending'
      },
      {
        nodeId: 'step_synthesize_recommendations',
        taskName: 'Synthesize Recommendations',
        agentId: 'learning_agent',
        dependencies: ['step_aggregate_skill_demand'],
        status: 'pending'
      }
    ];
  }
}
