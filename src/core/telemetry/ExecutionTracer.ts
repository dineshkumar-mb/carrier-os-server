export type SpanType = 'WORKFLOW' | 'AGENT' | 'TOOL' | 'BROWSER' | 'AI_MODEL' | 'DATABASE';

export interface ExecutionSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  type: SpanType;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  status: 'OK' | 'ERROR';
  attributes: Record<string, any>;
  errorMessage?: string;
}

export interface ExecutionTraceTree {
  executionId: string;
  userId: string;
  tenantId: string;
  rootSpan: ExecutionSpan;
  childSpans: ExecutionSpan[];
  totalDurationMs: number;
}

export class ExecutionTracer {
  private static instance: ExecutionTracer;
  private traces: Map<string, ExecutionSpan[]> = new Map();

  private constructor() {}

  public static getInstance(): ExecutionTracer {
    if (!ExecutionTracer.instance) {
      ExecutionTracer.instance = new ExecutionTracer();
    }
    return ExecutionTracer.instance;
  }

  public startSpan(params: {
    executionId: string;
    name: string;
    type: SpanType;
    parentSpanId?: string;
    attributes?: Record<string, any>;
  }): ExecutionSpan {
    const { executionId, name, type, parentSpanId, attributes } = params;

    const span: ExecutionSpan = {
      spanId: `span_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      parentSpanId,
      name,
      type,
      startTime: new Date(),
      status: 'OK',
      attributes: attributes || {}
    };

    if (!this.traces.has(executionId)) {
      this.traces.set(executionId, []);
    }

    this.traces.get(executionId)!.push(span);
    return span;
  }

  public endSpan(executionId: string, spanId: string, status: 'OK' | 'ERROR' = 'OK', errorMessage?: string): ExecutionSpan | undefined {
    const spans = this.traces.get(executionId);
    if (!spans) return undefined;

    const span = spans.find(s => s.spanId === spanId);
    if (span) {
      span.endTime = new Date();
      span.durationMs = span.endTime.getTime() - span.startTime.getTime();
      span.status = status;
      span.errorMessage = errorMessage;
    }
    return span;
  }

  public getTraceTree(executionId: string, userId: string = 'user_default', tenantId: string = 'tenant_default'): ExecutionTraceTree | undefined {
    const spans = this.traces.get(executionId);
    if (!spans || spans.length === 0) return undefined;

    const rootSpan = spans[0];
    const childSpans = spans.slice(1);
    const totalDurationMs = spans.reduce((sum, s) => sum + (s.durationMs || 0), 0);

    return {
      executionId,
      userId,
      tenantId,
      rootSpan,
      childSpans,
      totalDurationMs
    };
  }
}
