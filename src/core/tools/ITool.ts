export interface ToolMetadata {
  name: string;
  description: string;
  parametersSchema: Record<string, any>;
  /** Max execution time in ms. Runtime enforces via Promise.race. Default: 30000 */
  timeoutMs?: number;
}

export interface ToolExecutionResult {
  toolId: string;
  success: boolean;
  output?: any;
  error?: string;
  executionTimeMs: number;
}

export interface ITool {
  id: string;
  metadata: ToolMetadata;
  execute(params: any): Promise<ToolExecutionResult>;
}
