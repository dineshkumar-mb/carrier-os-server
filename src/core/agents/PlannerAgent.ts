import { agentRegistry, AgentRegistry } from './AgentRegistry';
import { AgentContext, AgentResult } from './IAgent';
import { scheduler, DAGNode } from '../runtime/Scheduler';

export class PlannerAgent {
  private registry: AgentRegistry;

  constructor() {
    this.registry = agentRegistry;
  }

  public planCapabilityDAG(goal: string): DAGNode[] {
    console.log(`[PlannerAgent] 🎯 Capability-based planning for Goal: "${goal}"`);

    // Discover agents by capabilities rather than hardcoded IDs
    const recruiterAgents = this.registry.findAgentsByCapability('experience') || this.registry.findAgentsByCapability('ats');
    const technicalAgents = this.registry.findAgentsByCapability('architecture') || this.registry.findAgentsByCapability('problem');
    const atsAgents = this.registry.findAgentsByCapability('ats');
    const salaryAgents = this.registry.findAgentsByCapability('salary');
    const reflectionAgents = this.registry.findAgentsByCapability('reflection');

    const recruiterId = recruiterAgents[0]?.id || 'agent_recruiter';
    const techLeadId = technicalAgents[0]?.id || 'agent_hiring_manager';
    const atsId = atsAgents[0]?.id || 'agent_ats';
    const salaryId = salaryAgents[0]?.id || 'agent_salary';
    const reflectionId = reflectionAgents[0]?.id || 'agent_reflection';

    // Parallel DAG Nodes: Recruiter, TechLead, ATS, Salary can run concurrently in parallel!
    const nodes: DAGNode[] = [
      {
        nodeId: 'task_recruiter',
        taskName: 'HR Recruiter Screening',
        agentId: recruiterId,
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'task_hiring_manager',
        taskName: 'Engineering Lead Assessment',
        agentId: techLeadId,
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'task_ats',
        taskName: 'ATS Compliance Verification',
        agentId: atsId,
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'task_salary',
        taskName: 'Compensation & Total Rewards Audit',
        agentId: salaryId,
        dependencies: [],
        status: 'pending'
      },
      {
        nodeId: 'task_reflection',
        taskName: 'Meta-Reflection & Memory Capture',
        agentId: reflectionId,
        dependencies: ['task_recruiter', 'task_hiring_manager', 'task_ats', 'task_salary'], // Runs after evaluation parallel batch completes
        status: 'pending'
      }
    ];

    return nodes;
  }

  public async executeGoalPlan(goal: string, context: AgentContext): Promise<{ executionId: string; results: AgentResult[] }> {
    const dagNodes = this.planCapabilityDAG(goal);

    console.log(`[PlannerAgent] Handing off ${dagNodes.length} DAG nodes to Scheduler runtime...`);
    const { executionId, finalResults } = await scheduler.scheduleAndExecute(context as any, dagNodes);

    return { executionId, results: finalResults };
  }
}

export const plannerAgent = new PlannerAgent();
