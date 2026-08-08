import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class CompanyResearchWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'company_research_workflow',
    name: 'Company Research Workflow',
    description: 'Deep dives into target organization products, Glassdoor culture, funding, and tech stack.',
    requiredCapabilities: ['Company Profiling'],
    qualityGates: ['CompanyValidationGate'],
    policyModesAllowed: ['Manual', 'Assisted', 'Automatic']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'step_company_insights',
        taskName: 'Fetch Company Insights',
        agentId: 'company_intelligence_agent',
        dependencies: [],
        status: 'pending'
      }
    ];
  }
}
