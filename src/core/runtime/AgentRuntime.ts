import { IAgent, AgentContext, AgentResult } from '../agents/IAgent';
import { tieredMemoryService } from '../../services/memory/TieredMemoryService';
import { toolRegistry } from '../tools/ToolRegistry';
import { EvaluationEngine } from '../../services/ai/EvaluationEngine';
import { eventBus } from '../events/EventBus';
import { runtimeEvents } from '../events/RuntimeEventEmitter';

/** Wraps a promise with a timeout. Rejects with TimeoutError if exceeded. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`[Timeout] "${label}" exceeded ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

export interface RuntimeOptions {
  maxRetries?: number;
  minScore?: number;
  minConfidence?: number;
}

export class AgentRuntime {
  public static async executeSandboxed(
    agent: IAgent,
    context: AgentContext,
    options: RuntimeOptions = {}
  ): Promise<AgentResult> {
    const maxRetries = options.maxRetries || 2;
    let attempt = 0;
    let lastResult: AgentResult | null = null;
    let lastError: any = null;

    console.log(`[AgentRuntime] 🛡️ Sandboxed execution started for agent "${agent.name}" (${agent.id})`);

    // 1. Inject Memory
    const episodicMemories = tieredMemoryService.getEpisodicMemories(context.userId);
    const semanticMemories = tieredMemoryService.getSemanticMemories(context.userId);

    const enrichedContext: AgentContext = {
      ...context,
      customParams: {
        ...(context.customParams || {}),
        injectedEpisodicCount: episodicMemories.length,
        injectedSemanticCount: semanticMemories.length,
        availableToolIds: toolRegistry.getAllTools().map(t => t.id)
      }
    };

    // 2. Execution & Evaluation Loop
    while (attempt <= maxRetries) {
      attempt++;
      try {
        console.log(`[AgentRuntime] Attempt ${attempt}/${maxRetries + 1} for agent "${agent.id}"`);
        runtimeEvents.emitEvent('Agent:Started', { executionId: context.userId, details: { agentId: agent.id, attempt } });

        // Resolve optional tool timeout from registry
        const agentTool = toolRegistry.getAllTools().find(t => t.id === agent.id);
        const timeoutMs = agentTool?.metadata?.timeoutMs ?? 30_000;

        const result = await withTimeout(
          agent.execute(enrichedContext),
          timeoutMs,
          agent.name
        );
        lastResult = result;

        // 3. Validate Output with Evaluation Engine
        const evaluation = EvaluationEngine.evaluateOutput(result, {
          minScore: options.minScore || 40,
          minConfidence: options.minConfidence || 0.6
        });

        if (evaluation.passed) {
          console.log(`[AgentRuntime] ✅ Output passed Evaluation Engine check for "${agent.name}".`);

          // 4. Publish Event
          eventBus.publish({
            eventType: 'ExecutionGraphUpdated',
            userId: context.userId,
            timestamp: new Date(),
            jobId: context.jobId,
            data: { agentId: agent.id, score: result.score, confidence: result.confidence }
          });

          // 5. Persist Working Memory
          tieredMemoryService.setWorkingMemory(agent.id, 'lastResult', result);
          runtimeEvents.emitEvent('Agent:Completed', { executionId: context.userId, details: { agentId: agent.id, score: result.score } });
          return result;
        } else {
          console.warn(`[AgentRuntime] ⚠️ Output failed evaluation check (Attempt ${attempt}): ${evaluation.feedback}`);
        }
      } catch (err: any) {
        console.error(`[AgentRuntime] ❌ Execution error on attempt ${attempt}:`, err);
        lastError = err;
      }
    }

    if (lastResult) {
      console.warn(`[AgentRuntime] Retries exhausted. Returning best available result for "${agent.name}".`);
      return lastResult;
    }

    throw lastError || new Error(`AgentRuntime: Execution failed for agent "${agent.id}"`);
  }
}
