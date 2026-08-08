export interface ExecutionNode {
  id: string;
  name: string;
  agentId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  input?: any;
  output?: any;
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  reflection?: string;
  confidence?: number;
}

export interface ExecutionEdge {
  from: string; // Node ID
  to: string;   // Node ID
  label?: string;
}

export interface ExecutionTrace {
  traceId: string;
  userId: string;
  goal: string;
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
  createdAt: Date;
  status: 'in_progress' | 'completed' | 'failed';
  totalDurationMs?: number;
}

export class ExecutionGraphManager {
  private traces: Map<string, ExecutionTrace> = new Map();

  public createTrace(userId: string, goal: string): ExecutionTrace {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const trace: ExecutionTrace = {
      traceId,
      userId,
      goal,
      nodes: [],
      edges: [],
      createdAt: new Date(),
      status: 'in_progress'
    };
    this.traces.set(traceId, trace);
    return trace;
  }

  public addNode(traceId: string, node: Omit<ExecutionNode, 'status'>): ExecutionNode {
    const trace = this.traces.get(traceId);
    if (!trace) throw new Error(`Trace not found: ${traceId}`);

    const newNode: ExecutionNode = {
      ...node,
      status: 'pending'
    };
    trace.nodes.push(newNode);
    return newNode;
  }

  public addEdge(traceId: string, fromNodeId: string, toNodeId: string, label?: string): void {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.edges.push({ from: fromNodeId, to: toNodeId, label });
    }
  }

  public updateNodeStatus(
    traceId: string,
    nodeId: string,
    status: 'running' | 'completed' | 'failed',
    data?: Partial<ExecutionNode>
  ): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const node = trace.nodes.find(n => n.id === nodeId);
    if (node) {
      node.status = status;
      if (status === 'running' && !node.startTime) {
        node.startTime = Date.now();
      } else if (status === 'completed' || status === 'failed') {
        node.endTime = Date.now();
        if (node.startTime) {
          node.durationMs = node.endTime - node.startTime;
        }
      }
      if (data) {
        Object.assign(node, data);
      }
    }
  }

  public completeTrace(traceId: string, status: 'completed' | 'failed' = 'completed'): ExecutionTrace | undefined {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.status = status;
      const firstStart = Math.min(...trace.nodes.map(n => n.startTime || Date.now()));
      trace.totalDurationMs = Date.now() - (firstStart || Date.now());
    }
    return trace;
  }

  public getTrace(traceId: string): ExecutionTrace | undefined {
    return this.traces.get(traceId);
  }

  public getUserTraces(userId: string): ExecutionTrace[] {
    return Array.from(this.traces.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const executionGraphManager = new ExecutionGraphManager();
