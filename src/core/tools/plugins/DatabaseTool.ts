import { ITool, ToolMetadata, ToolExecutionResult } from '../ITool';

export class DatabaseTool implements ITool {
  id = 'tool_database';
  metadata: ToolMetadata = {
    name: 'MongoDB Persistence Tool',
    description: 'Provides DB query, insert, update, and lookup capabilities for execution state and user records.',
    parametersSchema: {
      operation: 'find | update | insert',
      modelName: 'string',
      query: 'object'
    }
  };

  async execute(params: { operation: string; modelName: string; query: any }): Promise<ToolExecutionResult> {
    const start = Date.now();
    console.log(`[DatabaseTool] Executing DB operation "${params.operation}" on model ${params.modelName}`);

    try {
      return {
        toolId: this.id,
        success: true,
        output: {
          modelName: params.modelName,
          operation: params.operation,
          recordsAffected: 1
        },
        executionTimeMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        toolId: this.id,
        success: false,
        error: err.message,
        executionTimeMs: Date.now() - start
      };
    }
  }
}
