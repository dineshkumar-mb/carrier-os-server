import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class InterviewPrepWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'interview_prep_workflow',
    name: 'Interview Preparation & Company Research Workflow',
    description: 'Generates targeted role-specific interview questions, synthesizes company research, maps candidate projects, and evaluates mock interview answers.',
    requiredCapabilities: ['Company Intelligence', 'Question Generator', 'Mock Evaluator'],
    qualityGates: ['CompanyValidationGate'],
    policyModesAllowed: ['MANUAL', 'ASSISTED', 'AUTOMATIC']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'node_company_research',
        taskName: 'Synthesize Deep Company & Product Research',
        agentId: 'company_research_agent',
        dependencies: [],
        status: 'pending',
        maxRetries: 1
      },
      {
        nodeId: 'node_generate_questions',
        taskName: 'Generate Role-Specific System Design & Behavioral Questions',
        agentId: 'question_generator_agent',
        dependencies: ['node_company_research'],
        status: 'pending',
        maxRetries: 0
      },
      {
        nodeId: 'node_map_projects',
        taskName: 'Map Master Resume Candidate Projects to Interview Prompts',
        agentId: 'project_mapping_agent',
        dependencies: ['node_generate_questions'],
        status: 'pending',
        maxRetries: 0
      }
    ];
  }
}
