import mongoose from 'mongoose';
import connection from '../../config/redis';
import { ExecutionStateMachine, ExecutionState } from './ExecutionStateMachine';
import { AgentRuntime } from './AgentRuntime';
import { agentRegistry } from '../agents/AgentRegistry';
import { AgentResult } from '../agents/IAgent';
import { ExecutionContext } from './ExecutionContext';
import { ExecutionPlan, IExecutionPlanDocument } from '../../models/ExecutionPlan';
import { eventBus } from '../events/EventBus';
import { runtimeEvents } from '../events/RuntimeEventEmitter';

export interface GateResult {
  passed: boolean;
  reason?: string;
}

export interface GateMiddleware {
  name: string;
  execute(context: ExecutionContext): Promise<GateResult>;
}

export interface DAGNode {
  nodeId: string;
  taskName: string;
  agentId: string;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  result?: AgentResult;
  /** Per-node retry budget. Default: 0 (no retries). */
  maxRetries?: number;
  /** Internal counter tracked by the Scheduler. */
  currentRetries?: number;
  /** Optional cleanup hook invoked after exhausted retries. */
  compensationAction?: () => Promise<void>;
}

export class Scheduler {
  private activePlans: Map<string, { fsm: ExecutionStateMachine; nodes: Map<string, DAGNode> }> = new Map();

  private pipeline: GateMiddleware[] = [];

  public use(middleware: GateMiddleware) {
    this.pipeline.push(middleware);
  }

  public async scheduleAndExecute(
    context: ExecutionContext,
    dagNodes: DAGNode[]
  ): Promise<{ executionId: string; finalResults: AgentResult[] }> {
    const executionId = context.executionId || `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    context.executionId = executionId;
    const fsm = new ExecutionStateMachine('CREATED');

    fsm.transitionTo('PLANNING', 'Initial plan registered');

    const nodeMap = new Map<string, DAGNode>();
    for (const node of dagNodes) {
      nodeMap.set(node.nodeId, { ...node, status: 'pending' });
    }

    this.activePlans.set(executionId, { fsm, nodes: nodeMap });

    // Persist ExecutionPlan to Database
    let dbPlan: IExecutionPlanDocument | null = null;
    try {
      const ctxAny = context as any;
      const isMongoConnected = mongoose.connection.readyState === 1;
      const isRedisConnected = connection.status === 'ready';
      const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

      dbPlan = await ExecutionPlan.create({
        executionId,
        userId: context.user?._id || ctxAny.userId || ctxAny.user || 'unknown',
        goal: ctxAny.goal || context.workflowId || 'Goal Execution',
        state: 'PLANNING',
        nodes: dagNodes.map(n => ({
          nodeId: n.nodeId,
          taskName: n.taskName,
          agentId: n.agentId,
          status: 'pending',
          dependencies: n.dependencies,
          retries: 0
        })),
        telemetry: {
          environment: (process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT') as any,
          storage: isMongoConnected ? 'MONGODB' : 'IN-MEMORY',
          queue: isRedisConnected ? 'REDIS' : 'IN-MEMORY',
          aiProvider: hasOpenAI ? 'OPENAI' : 'HEURISTIC',
          runtimeVersion: '2.0.0',
          workflowVersion: '1.0.0',
          schemaVersion: '1.0.0'
        },
        contextData: context
      });
    } catch (dbErr) {
      console.warn('[Scheduler] DB persistence warning (non-fatal):', dbErr);
    }

    fsm.transitionTo('READY', 'All DAG nodes mapped');
    fsm.transitionTo('RUNNING', 'Starting parallel execution engine');

    if (dbPlan) {
      dbPlan.state = 'RUNNING';
      await dbPlan.save().catch(() => {});
    }

    const finalResults: AgentResult[] = [];

    // Parallel DAG execution loop
    while (Array.from(nodeMap.values()).some(n => n.status === 'pending' || n.status === 'running' || n.status === 'retrying')) {
      const pendingNodes = Array.from(nodeMap.values()).filter(n =>
        n.status === 'pending' || n.status === 'retrying'
      );
      const readyNodes = pendingNodes.filter(node =>
        node.dependencies.every(depId => nodeMap.get(depId)?.status === 'completed')
      );

      if (readyNodes.length === 0 && Array.from(nodeMap.values()).some(n => n.status === 'running')) {
        // Wait for running nodes to finish
        await new Promise(res => setTimeout(res, 200));
        continue;
      }

      if (readyNodes.length === 0) {
        console.error('[Scheduler] ❌ Circular dependency or blocked DAG detected!');
        fsm.transitionTo('FAILED', 'Blocked DAG');
        break;
      }

      console.log(`[Scheduler] ⚡ Executing ${readyNodes.length} parallel DAG nodes...`);

      // Run ready nodes concurrently using Promise.all!
      await Promise.all(
        readyNodes.map(async node => {
          node.status = 'running';
          const agent = agentRegistry.getAgent(node.agentId);

          if (!agent) {
            console.warn(`[Scheduler] Agent ${node.agentId} not found in registry.`);
            node.status = 'failed';
            return;
          }

          try {
            const startTime = Date.now();
            runtimeEvents.emitEvent('Scheduler:Started', { executionId, nodeId: node.nodeId });

            // Execute Middleware Pipeline
            let pipelinePassed = true;
            for (const gate of this.pipeline) {
              runtimeEvents.emitEvent('Gate:Started', { executionId, gateName: gate.name });
              const result = await gate.execute(context);
              if (!result.passed) {
                runtimeEvents.emitEvent('Gate:Failed', { executionId, gateName: gate.name, details: { reason: result.reason } });
                pipelinePassed = false;
                break;
              }
              runtimeEvents.emitEvent('Gate:Passed', { executionId, gateName: gate.name });
            }

            if (pipelinePassed) {
              // Final destination: execute the agent
              const result = await AgentRuntime.executeSandboxed(agent, context as any); // Type assertion until AgentRuntime is updated
              node.result = result;
            } else {
              node.status = 'failed';
              node.result = { agentId: agent.id, agentName: agent.name, score: 0, confidence: 0, reasoning: 'Blocked by Quality Gate', evidence: [] };
            }
            
            const duration = Date.now() - startTime;

            node.status = 'completed';
            if (node.result) {
              finalResults.push(node.result);
            }

            console.log(`[Scheduler] ✅ Parallel Node Completed: "${node.taskName}" (${duration}ms)`);
          } catch (err: any) {
            console.error(`[Scheduler] ❌ Node "${node.taskName}" failed:`, err);
            const budget = node.maxRetries ?? 0;
            const used = node.currentRetries ?? 0;

            if (used < budget) {
              node.currentRetries = used + 1;
              node.status = 'retrying';
              runtimeEvents.emitEvent('Scheduler:Retry', {
                executionId,
                nodeId: node.nodeId,
                details: { attempt: used + 1, maxRetries: budget }
              });
              console.warn(`[Scheduler] 🔄 Retrying node "${node.taskName}" (${used + 1}/${budget})`);
            } else {
              node.status = 'failed';
              // Invoke compensation action if defined
              if (node.compensationAction) {
                console.warn(`[Scheduler] 🧹 Running compensation action for "${node.taskName}"...`);
                runtimeEvents.emitEvent('Runtime:Started', { executionId, nodeId: node.nodeId, details: { phase: 'compensation' } });
                await node.compensationAction().catch(compErr =>
                  console.error(`[Scheduler] Compensation action failed for "${node.taskName}":`, compErr)
                );
              }
            }
          }
        })
      );
    }

    fsm.transitionTo('COMPLETED', 'All DAG nodes executed');

    if (dbPlan) {
      dbPlan.state = 'COMPLETED';
      dbPlan.completedAt = new Date();
      await dbPlan.save().catch(() => {});
    }

    runtimeEvents.emitEvent('Workflow:Completed', { executionId, details: { totalExecuted: finalResults.length } });

    eventBus.publish({
      eventType: 'ExecutionGraphUpdated',
      userId: context.user?._id,
      timestamp: new Date(),
      jobId: context.job?.id,
      data: { executionId, totalExecuted: finalResults.length }
    });

    return { executionId, finalResults };
  }
}

export const scheduler = new Scheduler();
