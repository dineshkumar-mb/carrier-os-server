import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class PortfolioOptimizationWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'portfolio_optimization_workflow',
    name: 'Portfolio Optimization Workflow',
    description: 'Audits GitHub repos, personal portfolio sites, and project documentation for target role alignment.',
    requiredCapabilities: ['GitHub Repo Audit'],
    qualityGates: ['ResumeQualityGate'],
    policyModesAllowed: ['Manual', 'Assisted', 'Automatic']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'step_audit_portfolio',
        taskName: 'Audit Portfolio & GitHub Repos',
        agentId: 'portfolio_optimization_agent',
        dependencies: [],
        status: 'pending'
      }
    ];
  }
}
