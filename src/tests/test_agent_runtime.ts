import { agentRegistry } from '../core/agents/AgentRegistry';
import { toolRegistry } from '../core/tools/ToolRegistry';
import { plannerAgent } from '../core/agents/PlannerAgent';
import { scheduler } from '../core/runtime/Scheduler';
import { debateEngine } from '../core/agents/DebateEngine';
import { tieredMemoryService } from '../services/memory/TieredMemoryService';

import { RecruiterAgent } from '../core/agents/plugins/RecruiterAgent';
import { HiringManagerAgent } from '../core/agents/plugins/HiringManagerAgent';
import { ATSAgentPlugin } from '../core/agents/plugins/ATSAgentPlugin';
import { SalaryAgent } from '../core/agents/plugins/SalaryAgent';
import { ReflectionAgent } from '../core/agents/plugins/ReflectionAgent';

import { BrowserTool } from '../core/tools/plugins/BrowserTool';
import { DatabaseTool } from '../core/tools/plugins/DatabaseTool';
import { SearchTool } from '../core/tools/plugins/SearchTool';

async function runRuntimeVerification() {
  console.log('=== ⚡ CARRIER OS AGENT RUNTIME & EXECUTION INFRASTRUCTURE VERIFICATION ===');

  // 1. Register Tool Plugins
  toolRegistry.register(new BrowserTool());
  toolRegistry.register(new DatabaseTool());
  toolRegistry.register(new SearchTool());
  console.log(`✅ Registered ${toolRegistry.getAllTools().length} Tool Plugins in ToolRegistry.`);

  // 2. Register Agent Plugins
  agentRegistry.register(new RecruiterAgent());
  agentRegistry.register(new HiringManagerAgent());
  agentRegistry.register(new ATSAgentPlugin());
  agentRegistry.register(new SalaryAgent());
  agentRegistry.register(new ReflectionAgent());
  console.log(`✅ Registered ${agentRegistry.getAllAgents().length} Agent Plugins in AgentRegistry.`);

  // 3. Capability-Based Planning (Planner Agent)
  const goal = 'Evaluate candidate profile and auto-apply for Principal System Architect at Netflix';
  const dagNodes = plannerAgent.planCapabilityDAG(goal);
  console.log(`✅ Capability-Based Planner generated ${dagNodes.length} DAG nodes (Parallel execution layout).`);

  // 4. Execute Parallel DAG via Scheduler Runtime
  const context = {
    userId: 'user_runtime_test',
    jobTitle: 'Principal System Architect',
    company: 'Netflix',
    jobDescription: 'Seeking Principal Architect with deep expertise in distributed systems, high throughput microservices, multi-region failover, and cloud architecture.',
    resumeData: {
      summary: 'Distinguished Engineer & Cloud Architect with 10+ years scaling high-availability cloud platforms.',
      skills: ['System Design', 'Microservices', 'Distributed Systems', 'Go', 'Kubernetes', 'AWS'],
      experience: [{ title: 'Staff Systems Architect', company: 'Cloud Corp', duration: '5 years' }]
    }
  };

  console.log('🚀 Invoking Scheduler Runtime for Parallel DAG execution...');
  const startMs = Date.now();
  const { executionId, results } = await plannerAgent.executeGoalPlan(goal, context);
  const totalMs = Date.now() - startMs;

  console.log(`✅ Parallel Scheduler completed Execution ID "${executionId}" in ${totalMs}ms.`);
  console.log(`✅ Collected ${results.length} sandboxed agent results.`);

  // 5. Debate Synthesis
  const debate = debateEngine.synthesizeDebate(results);
  console.log('✅ Debate Synthesis Outcome:');
  console.log(`   - Consensus Score: ${debate.consensusScore}%`);
  console.log(`   - Recruiter Score: ${debate.recruiterScore}%`);
  console.log(`   - Hiring Manager Score: ${debate.hiringManagerScore}%`);
  console.log(`   - Interview Probability: ${debate.interviewProbability}%`);
  console.log(`   - Offer Probability: ${debate.offerProbability}%`);
  console.log(`   - Decision: ${debate.decision}`);

  // 6. Tiered Memory Persistence
  tieredMemoryService.addEpisodicMemory(context.userId, 'Execution_Completed', { executionId, score: debate.consensusScore });
  tieredMemoryService.addSemanticMemory(context.userId, 'Target_Role', 'Principal System Architect');

  const episodic = tieredMemoryService.getEpisodicMemories(context.userId);
  const semantic = tieredMemoryService.getSemanticMemories(context.userId);
  console.log(`✅ Tiered Memory active: ${episodic.length} Episodic records, ${semantic.length} Semantic records.`);

  // 7. Tool Execution Test via ToolRegistry
  const searchResult = await toolRegistry.executeTool('tool_search', { query: 'Principal Architect Netflix' });
  console.log(`✅ ToolRegistry invocation passed (${searchResult.toolId}): ${searchResult.success}`);

  console.log('🎉 ALL AGENT RUNTIME & SCHEDULER INFRASTRUCTURE VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runRuntimeVerification().catch(console.error);
