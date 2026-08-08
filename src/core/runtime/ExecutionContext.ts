export interface ExecutionMetadata {
  executionId: string;
  workflowId: string;
  user: any;
}

export interface ExecutionResources {
  memory: any; // MemoryProvider
  knowledge: any; // Knowledge base retrieval
  tools: Map<string, any>; // Registered tools
  policy: any; // Policy engine config
  logger: any; // Execution logger
}

export interface ExecutionState {
  variables: Record<string, any>;
  artifacts: Map<string, any>; // File paths, IDs
  events: any[];
  cancellationToken: { isCancelled: boolean; reason?: string };
}

export interface ExecutionContext {
  metadata: ExecutionMetadata;
  resources: ExecutionResources;
  state: ExecutionState;
  
  // Backwards compatibility getters (will be phased out)
  executionId: string;
  workflowId: string;
  user: any;
  job?: any;
}
