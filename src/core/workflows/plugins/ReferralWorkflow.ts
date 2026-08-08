import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class ReferralWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'referral_workflow',
    name: 'Referral Workflow (Marketplace Plugin)',
    description: 'Identifies mutual contacts and alumni working at target companies to request internal application referrals.',
    requiredCapabilities: ['Company Profiling'],
    qualityGates: ['CompanyValidationGate'],
    policyModesAllowed: ['Manual', 'Assisted', 'Automatic']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'step_identify_referrals',
        taskName: 'Identify Network Referral Opportunities',
        agentId: 'company_intelligence_agent',
        dependencies: [],
        status: 'pending'
      }
    ];
  }
}
