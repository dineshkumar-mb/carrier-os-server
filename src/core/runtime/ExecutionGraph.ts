import { ExecutionPlan } from '../../models/ExecutionPlan';
import { runtimeEvents } from '../events/RuntimeEventEmitter';

export interface GraphNodeState {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  gateResults: Record<string, boolean>; // e.g., { DuplicateGate: true, RiskGate: true }
  agentResult?: any;
  artifacts: string[]; // Generated artifacts tied to this node
  events: any[]; // Specific events for this node
}

export class ExecutionGraph {
  public executionId: string;
  public nodes: Map<string, GraphNodeState> = new Map();

  constructor(executionId: string) {
    this.executionId = executionId;
  }

  public registerNode(nodeId: string) {
    if (!this.nodes.has(nodeId)) {
      this.nodes.set(nodeId, {
        nodeId,
        status: 'pending',
        gateResults: {},
        artifacts: [],
        events: []
      });
    }
  }

  public updateNodeStatus(nodeId: string, status: GraphNodeState['status']) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      this.persist();
    }
  }

  public recordGateResult(nodeId: string, gateName: string, passed: boolean) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.gateResults[gateName] = passed;
      this.persist();
    }
  }

  public recordAgentResult(nodeId: string, result: any) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.agentResult = result;
      this.persist();
    }
  }

  private async persist() {
    try {
      const plan = await ExecutionPlan.findOne({ executionId: this.executionId });
      if (plan) {
        // Compute arrays
        const pendingNodes = [];
        const completedNodes = [];
        const failedNodes = [];

        for (const [id, state] of this.nodes.entries()) {
          if (state.status === 'pending') pendingNodes.push(id);
          if (state.status === 'completed') completedNodes.push(id);
          if (state.status === 'failed') failedNodes.push(id);
        }

        plan.pendingNodes = pendingNodes;
        plan.completedNodes = completedNodes;
        plan.failedNodes = failedNodes;
        
        await plan.save();

        runtimeEvents.emitEvent('System:Updated', {
          executionId: this.executionId,
          details: { graphPersisted: true }
        });
      }
    } catch (err) {
      console.error(`[ExecutionGraph] Failed to persist graph state for ${this.executionId}`, err);
    }
  }
  /** Takes a point-in-time snapshot and persists it for crash recovery. */
  public async snapshot(variables: Record<string, any> = {}, memoryRefs: string[] = [], artifactRefs: string[] = []) {
    try {
      const plan = await ExecutionPlan.findOne({ executionId: this.executionId });
      if (!plan) return;

      // Compute current graph state
      let currentNode: string | undefined;
      const pendingNodes: string[] = [];
      const completedNodes: string[] = [];
      const failedNodes: string[] = [];

      for (const [id, state] of this.nodes.entries()) {
        if (state.status === 'running') currentNode = id;
        if (state.status === 'pending' || state.status === 'retrying') pendingNodes.push(id);
        if (state.status === 'completed') completedNodes.push(id);
        if (state.status === 'failed') failedNodes.push(id);
      }

      plan.currentNode = currentNode;
      plan.pendingNodes = pendingNodes;
      plan.completedNodes = completedNodes;
      plan.failedNodes = failedNodes;
      plan.variables = variables;
      plan.memorySnapshot = { refs: memoryRefs };
      plan.artifacts = { refs: artifactRefs };
      plan.events.push({ type: 'Snapshot', timestamp: new Date(), currentNode });

      await plan.save();

      runtimeEvents.emitEvent('System:Updated', {
        executionId: this.executionId,
        details: { snapshotTaken: true, currentNode }
      });
    } catch (err) {
      console.error(`[ExecutionGraph] Snapshot failed for ${this.executionId}`, err);
    }
  }
}
