import { IWorkflow, WorkflowDefinition } from '../IWorkflow';
import { DAGNode } from '../../runtime/Scheduler';

/**
 * Full InterviewPrepWorkflow DAG:
 *
 *   Planning (HiringManager)
 *       │
 *       ▼
 *   Question Generation (QuestionGenerator) ──────────────────┐
 *       │                                                      │
 *       ▼                                                      │
 *   Conversation / Answer Sim (HiringManager)                  │
 *       │                                                      │
 *       ▼                                                      │
 *   Evaluation & Scoring (InterviewEvaluator) ◄────────────────┘
 *       │
 *       ▼
 *   Feedback Synthesis (Reflection)
 *       │
 *       ▼
 *   Learning Memory Capture (Reflection)
 */
export class InterviewPrepWorkflow implements IWorkflow {
  definition: WorkflowDefinition = {
    id: 'workflow_interview_prep',
    name: 'AI Interview Preparation Workflow',
    description: 'Generates role-specific interview questions, simulates a conversational interview session, evaluates answers, and commits learning to memory.',
    requiredCapabilities: ['architecture', 'reflection', 'question_design', 'evaluation'],
    qualityGates: [],
    policyModesAllowed: ['MANUAL', 'ASSISTED', 'AUTOMATIC']
  };

  buildDAG(context: any): DAGNode[] {
    return [
      // ── Phase 1: Planning ────────────────────────────────────────────
      {
        nodeId: 'node_interview_planning',
        taskName: 'Interview Strategy Planning',
        agentId: 'agent_hiring_manager',
        dependencies: [],
        status: 'pending',
        maxRetries: 1
      },

      // ── Phase 2: Question Generation ─────────────────────────────────
      {
        nodeId: 'node_question_generation',
        taskName: 'Role-Specific Question Generation',
        agentId: 'agent_question_generator',
        dependencies: ['node_interview_planning'],
        status: 'pending',
        maxRetries: 1
      },

      // ── Phase 3: Conversational Answer Simulation ─────────────────────
      // Uses the hiring manager agent to simulate a human interviewer
      // asking the generated questions and recording candidate answers.
      {
        nodeId: 'node_conversation',
        taskName: 'Interview Conversation Agent',
        agentId: 'agent_hiring_manager',
        dependencies: ['node_question_generation'],
        status: 'pending',
        maxRetries: 0 // Conversation sessions are not retried
      },

      // ── Phase 4: Evaluation & Scoring ────────────────────────────────
      {
        nodeId: 'node_evaluation',
        taskName: 'Answer Evaluation & Scoring',
        agentId: 'agent_interview_evaluator',
        dependencies: ['node_question_generation', 'node_conversation'],
        status: 'pending',
        maxRetries: 1
      },

      // ── Phase 5: Feedback Synthesis ──────────────────────────────────
      {
        nodeId: 'node_feedback',
        taskName: 'Structured Interview Feedback',
        agentId: 'agent_reflection',
        dependencies: ['node_evaluation'],
        status: 'pending',
        maxRetries: 0
      },

      // ── Phase 6: Learning Memory Capture ─────────────────────────────
      // Commits evaluation and feedback to semantic memory so future
      // interview prep sessions benefit from prior performance patterns.
      {
        nodeId: 'node_learning_memory',
        taskName: 'Learning Memory Capture',
        agentId: 'agent_reflection',
        dependencies: ['node_feedback'],
        status: 'pending',
        maxRetries: 0
      }
    ];
  }
}
