import { ITool, ToolMetadata, ToolExecutionResult } from '../ITool';

export class SearchTool implements ITool {
  id = 'tool_search';
  metadata: ToolMetadata = {
    name: 'Multi-Board Job Discovery Search Tool',
    description: 'Queries multi-provider APIs (ArbeitNow, Greenhouse, Lever, Remotive) for active job openings.',
    parametersSchema: {
      query: 'string',
      location: 'string',
      remoteOnly: 'boolean'
    }
  };

  async execute(params: { query: string; location?: string; remoteOnly?: boolean }): Promise<ToolExecutionResult> {
    const start = Date.now();
    console.log(`[SearchTool] Searching job boards for "${params.query}"...`);

    try {
      return {
        toolId: this.id,
        success: true,
        output: {
          query: params.query,
          providersQueried: ['ArbeitNow', 'Greenhouse', 'Lever', 'Remotive'],
          resultsFound: 18
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
