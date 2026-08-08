import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class JobDiscoveryWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'job_discovery_workflow',
    name: 'Job Discovery & AI Matching Workflow',
    description: 'Scans global sources, deduplicates postings, parses skills, and calculates candidate fit scores.',
    requiredCapabilities: ['Multi-Source Scraper', 'Skill Extraction', 'Match Scoring'],
    qualityGates: ['DuplicateCheckGate', 'CompanyValidationGate'],
    policyModesAllowed: ['Manual', 'Assisted', 'Automatic']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'step_discover_jobs',
        taskName: 'Discover Jobs Across Portals',
        agentId: 'job_discovery_agent',
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'step_extract_job_intel',
        taskName: 'Extract Job Intel & Skill Specs',
        agentId: 'job_intelligence_agent',
        dependencies: ['step_discover_jobs'],
        status: 'pending'
      },
      {
        nodeId: 'step_match_score',
        taskName: 'Calculate Candidate Fit Match Score',
        agentId: 'ai_matching_agent',
        dependencies: ['step_extract_job_intel'],
        status: 'pending'
      }
    ];
  }
}
