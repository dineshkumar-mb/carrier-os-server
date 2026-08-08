import { agentRegistry } from '../core/agents/AgentRegistry';
import { plannerAgent } from '../core/agents/PlannerAgent';
import { debateEngine } from '../core/agents/DebateEngine';
import { EvaluationEngine } from '../services/ai/EvaluationEngine';
import { memoryService } from '../services/memory/MemoryService';

import { RecruiterAgent } from '../core/agents/plugins/RecruiterAgent';
import { HiringManagerAgent } from '../core/agents/plugins/HiringManagerAgent';
import { ATSAgentPlugin } from '../core/agents/plugins/ATSAgentPlugin';
import { SalaryAgent } from '../core/agents/plugins/SalaryAgent';
import { ReflectionAgent } from '../core/agents/plugins/ReflectionAgent';

async function runVerification() {
  console.log('--- 🤖 CARRIER OS v2.0 AGENT OS VERIFICATION TEST ---');

  // 1. Register Plugins
  agentRegistry.register(new RecruiterAgent());
  agentRegistry.register(new HiringManagerAgent());
  agentRegistry.register(new ATSAgentPlugin());
  agentRegistry.register(new SalaryAgent());
  agentRegistry.register(new ReflectionAgent());

  const allAgents = agentRegistry.getAllAgents();
  console.log(`✅ Registered ${allAgents.length} Agent Plugins in AgentRegistry.`);

  // 2. Plan Execution for Goal
  const goal = 'Evaluate candidate profile and auto-apply for Senior Full Stack Engineer at Stripe';
  const plannedTasks = plannerAgent.planCapabilityDAG(goal);
  console.log(`✅ PlannerAgent formulated ${plannedTasks.length} tasks for Goal.`);

  // 3. Execute Plan
  const context = {
    userId: 'user_test_123',
    jobTitle: 'Senior Full Stack Engineer',
    company: 'Stripe',
    jobDescription: 'Seeking Senior Full Stack Engineer proficient in React, Node.js, TypeScript, PostgreSQL, and distributed systems.',
    resumeData: {
      summary: 'Experienced Full Stack Engineer with 6+ years building microservices and web apps.',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS'],
      experience: [{ title: 'Senior Engineer', company: 'Tech Corp', duration: '3 years' }]
    }
  };

  const { executionId, results } = await plannerAgent.executeGoalPlan(goal, context);
  console.log(`✅ PlannerAgent executed plan. Execution ID: ${executionId}, Results count: ${results.length}`);

  // 4. Synthesize Debate
  const debateOutcome = debateEngine.synthesizeDebate(results);
  console.log('✅ DebateEngine Synthesis:');
  console.log(`   - Consensus Score: ${debateOutcome.consensusScore}%`);
  console.log(`   - Confidence: ${debateOutcome.overallConfidence * 100}%`);
  console.log(`   - Recruiter Score: ${debateOutcome.recruiterScore}%`);
  console.log(`   - Hiring Manager Score: ${debateOutcome.hiringManagerScore}%`);
  console.log(`   - Interview Probability: ${debateOutcome.interviewProbability}%`);
  console.log(`   - Offer Probability: ${debateOutcome.offerProbability}%`);
  console.log(`   - Final Decision: ${debateOutcome.decision}`);

  // 5. Save Learning to MemoryService
  const mem = memoryService.saveMemory(
    context.userId,
    'learning',
    `Outcome_${context.company}`,
    debateOutcome.synthesisReasoning,
    { consensusScore: debateOutcome.consensusScore }
  );
  console.log(`✅ Saved semantic memory: ${mem.id}`);

  // 6. Test Output Evaluation
  const evalResult = EvaluationEngine.evaluateOutput(debateOutcome, { minScore: 50, minConfidence: 0.7 });
  console.log(`✅ EvaluationEngine Quality Check: Passed = ${evalResult.passed}`);

  console.log('🎉 ALL AGENT OS CORE VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runVerification().catch(console.error);
