import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutionPlanDocument extends Document {
  executionId: string;
  userId: string;
  goal: string;
  state: 'CREATED' | 'PLANNING' | 'READY' | 'RUNNING' | 'WAITING' | 'RETRYING' | 'FAILED' | 'COMPLETED' | 'CANCELLED';
  nodes: {
    nodeId: string;
    taskName: string;
    agentId?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    dependencies: string[]; // Node IDs that must complete first
    output?: any;
    error?: string;
    durationMs?: number;
    retries: number;
  }[];
  contextData: Record<string, any>;
  variables: Record<string, any>;
  artifacts: Record<string, any>;
  memorySnapshot: Record<string, any>;
  events: any[];
  currentNode?: string;
  completedNodes: string[];
  pendingNodes: string[];
  failedNodes: string[];
  telemetry: {
    environment: 'DEVELOPMENT' | 'PRODUCTION';
    storage: 'MONGODB' | 'IN-MEMORY';
    queue: 'REDIS' | 'IN-MEMORY';
    aiProvider: 'OPENAI' | 'HEURISTIC';
    runtimeVersion: string;
    workflowVersion: string;
    schemaVersion: string;
  };
  workflowVersion: string;
  runtimeVersion: string;
  schemaVersion: string;
  currentRetryCount: number;
  maxRetries: number;
  completedAt?: Date;
}

const ExecutionPlanSchema = new Schema<IExecutionPlanDocument>(
  {
    executionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    goal: { type: String, required: true },
    state: {
      type: String,
      enum: ['CREATED', 'PLANNING', 'READY', 'RUNNING', 'WAITING', 'RETRYING', 'FAILED', 'COMPLETED', 'CANCELLED'],
      default: 'CREATED'
    },
    nodes: [
      {
        nodeId: { type: String, required: true },
        taskName: { type: String, required: true },
        agentId: { type: String },
        status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
        dependencies: [{ type: String }],
        output: { type: Schema.Types.Mixed },
        error: { type: String },
        durationMs: { type: Number },
        retries: { type: Number, default: 0 }
      }
    ],
    contextData: { type: Schema.Types.Mixed, default: {} },
    variables: { type: Schema.Types.Mixed, default: {} },
    artifacts: { type: Schema.Types.Mixed, default: {} },
    memorySnapshot: { type: Schema.Types.Mixed, default: {} },
    events: [{ type: Schema.Types.Mixed }],
    currentNode: { type: String },
    completedNodes: [{ type: String }],
    pendingNodes: [{ type: String }],
    failedNodes: [{ type: String }],
    telemetry: {
      environment: { type: String, default: 'DEVELOPMENT' },
      storage: { type: String, default: 'IN-MEMORY' },
      queue: { type: String, default: 'IN-MEMORY' },
      aiProvider: { type: String, default: 'HEURISTIC' },
      runtimeVersion: { type: String, default: '2.0.0' },
      workflowVersion: { type: String, default: '1.0.0' },
      schemaVersion: { type: String, default: '1.0.0' }
    },
    workflowVersion: { type: String, default: '1.0.0' },
    runtimeVersion: { type: String, default: '1.0.0' },
    schemaVersion: { type: String, default: '1.0.0' },
    currentRetryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export const ExecutionPlan = mongoose.model<IExecutionPlanDocument>('ExecutionPlan', ExecutionPlanSchema);
