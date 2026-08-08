import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

export class CareerReviewWorkflow implements IWorkflow {
  public definition: WorkflowDefinition = {
    id: 'career_review_workflow',
    name: 'Career Review & Roadmap Audit Workflow',
    description: 'Evaluates long-term candidate goals, Skill Graph node depth, and progression milestones.',
    requiredCapabilities: ['Roadmap Generation', 'Skill Gap Matrix'],
    qualityGates: ['ResumeQualityGate'],
    policyModesAllowed: ['Manual', 'Assisted', 'Automatic']
  };

  public buildDAG(context: any): DAGNode[] {
    return [
      {
        nodeId: 'step_parse_master_resume',
        taskName: 'Parse Master Resume',
        agentId: 'resume_intelligence_agent',
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'step_generate_roadmap',
        taskName: 'Generate Career Growth Roadmap',
        agentId: 'career_planner_agent',
        dependencies: ['step_parse_master_resume'],
        status: 'pending'
      },
      {
        nodeId: 'step_recommend_learning',
        taskName: 'Recommend Curated Learning Paths',
        agentId: 'learning_agent',
        dependencies: ['step_generate_roadmap'],
        status: 'pending'
      }
    ];
  }
}
