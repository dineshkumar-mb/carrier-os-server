import { randomUUID } from 'crypto';
import { runtimeEvents } from '../events/RuntimeEventEmitter';

export interface ExecutionStartParams {
  type: 'APPLY' | 'RESUME_AUDIT' | 'INTERVIEW_PREP';
  userId: string;
  data: any;
}

export class ExecutionService {
  // Simple Feature Flag Map
  private featureFlags = {
    USE_NEW_RUNTIME_APPLY: true,   // Phase 2B: enabled
    USE_NEW_RUNTIME_RESUME: true,  // Phase 2A: enabled
    USE_NEW_RUNTIME_INTERVIEW: true // Phase 2C: enabled
  };

  public enableFeature(flag: keyof typeof ExecutionService.prototype.featureFlags) {
    this.featureFlags[flag] = true;
  }

  public disableFeature(flag: keyof typeof ExecutionService.prototype.featureFlags) {
    this.featureFlags[flag] = false;
  }

  public async start(params: ExecutionStartParams): Promise<string> {
    const executionId = `exec_${Date.now()}_${randomUUID().split('-')[0]}`;
    
    runtimeEvents.emitEvent('Workflow:Started', {
      executionId,
      details: { type: params.type, userId: params.userId }
    });

    if (params.type === 'APPLY') {
      if (this.featureFlags.USE_NEW_RUNTIME_APPLY) {
        await this.startNewRuntimeApply(executionId, params);
      } else {
        await this.startLegacyApply(executionId, params);
      }
    } else if (params.type === 'RESUME_AUDIT') {
      if (this.featureFlags.USE_NEW_RUNTIME_RESUME) {
        await this.startNewRuntimeResume(executionId, params);
      } else {
        await this.startLegacyResume(executionId, params);
      }
    } else if (params.type === 'INTERVIEW_PREP') {
      if (this.featureFlags.USE_NEW_RUNTIME_INTERVIEW) {
        await this.startNewRuntimeInterview(executionId, params);
      } else {
        console.warn(`[ExecutionService] Legacy Interview Prep path not implemented.`);
      }
    } else {
      console.warn(`[ExecutionService] Execution type ${params.type} not fully mapped yet.`);
    }

    return executionId;
  }

  private async startNewRuntimeResume(executionId: string, params: ExecutionStartParams) {
    console.log(`[ExecutionService] Starting Native Runtime Flow for Resume Audit ${executionId}`);
    
    // 1. Fetch Workflow from Registry
    const { workflowRegistry } = await import('../workflows/WorkflowRegistry');
    const { scheduler } = await import('../runtime/Scheduler');
    const { ExecutionGraph } = await import('../runtime/ExecutionGraph');
    
    const workflow = workflowRegistry.getWorkflow('workflow_resume_audit');
    if (!workflow) throw new Error('Resume Audit Workflow not found in registry');

    const dagNodes = workflow.buildDAG(params.data);

    // 2. Initialize Graph
    const graph = new ExecutionGraph(executionId);
    dagNodes.forEach(n => graph.registerNode(n.nodeId));

    // 3. Construct Strict ExecutionContext
    const context = {
      executionId,
      workflowId: 'workflow_resume_audit',
      user: { _id: params.userId },
      job: undefined,
      metadata: {
        executionId,
        workflowId: 'workflow_resume_audit',
        user: { _id: params.userId }
      },
      resources: {
        memory: {}, // Will inject TieredMemoryProvider
        knowledge: {}, 
        tools: new Map(),
        policy: {},
        logger: console
      },
      state: {
        variables: { ...params.data },
        artifacts: new Map(),
        events: [],
        cancellationToken: { isCancelled: false }
      }
    };

    // 4. Pass to Scheduler
    // Note: We don't await this directly if it's a long-running background process,
    // but for now, we'll fire and forget or await depending on API needs.
    scheduler.scheduleAndExecute(context as any, dagNodes).catch(err => {
      console.error(`[ExecutionService] Resume Workflow Failed:`, err);
    });
  }

  private async startLegacyResume(executionId: string, params: ExecutionStartParams) {
    console.log(`[ExecutionService] Starting Legacy Flow for Resume Audit ${executionId}`);
    // This would call the old aiController directly
  }

  private async startNewRuntimeInterview(executionId: string, params: ExecutionStartParams) {
    console.log(`[ExecutionService] Starting Native Runtime Flow for Interview Prep ${executionId}`);

    const { workflowRegistry } = await import('../workflows/WorkflowRegistry');
    const { scheduler } = await import('../runtime/Scheduler');
    const { ExecutionGraph } = await import('../runtime/ExecutionGraph');

    const workflow = workflowRegistry.getWorkflow('workflow_interview_prep');
    if (!workflow) throw new Error('Interview Prep Workflow not found in registry');

    const dagNodes = workflow.buildDAG(params.data);

    // Initialize graph and take a pre-execution snapshot
    const graph = new ExecutionGraph(executionId);
    dagNodes.forEach(n => graph.registerNode(n.nodeId));

    // Construct ExecutionContext — no job or browser dependency
    const context = {
      executionId,
      workflowId: 'workflow_interview_prep',
      user: { _id: params.userId },
      job: params.data.jobId ? { id: params.data.jobId } : undefined,
      metadata: {
        executionId,
        workflowId: 'workflow_interview_prep',
        user: { _id: params.userId }
      },
      resources: {
        memory: {},
        knowledge: {},
        tools: new Map(),
        policy: {},
        logger: console
      },
      state: {
        variables: { ...params.data },
        artifacts: new Map(),
        events: [],
        cancellationToken: { isCancelled: false }
      }
    };

    await graph.snapshot(context.state.variables);

    runtimeEvents.emitEvent('Workflow:Started', {
      executionId,
      details: { type: 'INTERVIEW_PREP', userId: params.userId }
    });

    // Fire and forget — long-running conversational session
    scheduler.scheduleAndExecute(context as any, dagNodes).catch(err => {
      console.error(`[ExecutionService] Interview Prep Workflow Failed:`, err);
    });
  }

  private async startNewRuntimeApply(executionId: string, params: ExecutionStartParams) {
    console.log(`[ExecutionService] Starting Native Runtime Flow for Apply ${executionId}`);

    // 1. Fetch Workflow from Registry
    const { workflowRegistry } = await import('../workflows/WorkflowRegistry');
    const { scheduler } = await import('../runtime/Scheduler');
    const { ExecutionGraph } = await import('../runtime/ExecutionGraph');

    const workflow = workflowRegistry.getWorkflow('workflow_apply_job');
    if (!workflow) throw new Error('Apply To Job Workflow not found in registry');

    const dagNodes = workflow.buildDAG(params.data);

    // 2. Initialize Execution Graph
    const graph = new ExecutionGraph(executionId);
    dagNodes.forEach(n => graph.registerNode(n.nodeId));

    // 3. Construct strict ExecutionContext
    const context = {
      executionId,
      workflowId: 'workflow_apply_job',
      user: { _id: params.userId },
      job: { id: params.data.jobId, url: params.data.jobUrl },
      metadata: {
        executionId,
        workflowId: 'workflow_apply_job',
        user: { _id: params.userId }
      },
      resources: {
        memory: {},
        knowledge: {},
        tools: new Map(),
        policy: {},
        logger: console
      },
      state: {
        variables: { ...params.data },
        artifacts: new Map(),
        events: [],
        cancellationToken: { isCancelled: false }
      }
    };

    // 4. Take initial snapshot before execution begins
    await graph.snapshot(context.state.variables);

    // 5. Fire-and-forget into Scheduler (long-running background process)
    scheduler.scheduleAndExecute(context as any, dagNodes).catch(err => {
      console.error(`[ExecutionService] Apply Workflow Failed:`, err);
    });
  }

  private async startLegacyApply(executionId: string, params: ExecutionStartParams) {
    console.log(`[ExecutionService] Starting Legacy Flow for Execution ${executionId}`);
    // We will import the applicationQueue to delegate this
    const { applicationQueue } = await import('../../workers/queue');
    
    await applicationQueue.add('auto-apply', {
      applicationId: params.data.applicationId,
      jobUrl: params.data.jobUrl,
      executionId // Pass down for tracing
    });
  }
}

export const executionService = new ExecutionService();
