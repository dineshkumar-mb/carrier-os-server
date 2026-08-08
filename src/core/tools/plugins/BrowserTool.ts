import { ITool, ToolMetadata, ToolExecutionResult } from '../ITool';
import { applicationQueue } from '../../../workers/queue';
import { runtimeEvents } from '../../events/RuntimeEventEmitter';

export class BrowserTool implements ITool {
  public id = 'tool_browser';
  
  public metadata: ToolMetadata = {
    name: 'Playwright Browser Automation Tool',
    description: 'Launches isolated Playwright browser contexts for web scraping, form filling, and job application submission.',
    timeoutMs: 120_000, // 2 minutes — enforced by AgentRuntime
    parametersSchema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string' },
        jobUrl: { type: 'string' },
        executionId: { type: 'string' }
      },
      required: ['applicationId', 'jobUrl']
    }
  };

  public async execute(params: any): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const { applicationId, jobUrl, executionId } = params;

    runtimeEvents.emitEvent('Tool:Started', {
      executionId: executionId || 'unknown',
      toolName: this.id,
      details: { applicationId, jobUrl }
    });

    try {
      // PHASE 1: Adapter over Legacy Worker
      // Instead of driving Playwright directly here, we enqueue to the existing BullMQ applyWorker
      await applicationQueue.add('auto-apply', {
        applicationId,
        jobUrl,
        executionId // Tracing ID
      });

      const duration = Date.now() - startTime;
      
      runtimeEvents.emitEvent('Tool:Completed', {
        executionId: executionId || 'unknown',
        toolName: this.id,
        details: { status: 'queued_to_legacy_worker' }
      });

      return {
        toolId: this.id,
        success: true,
        output: { status: 'Queued to Playwright Worker Pool' },
        executionTimeMs: duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        toolId: this.id,
        success: false,
        error: error.message,
        executionTimeMs: duration
      };
    }
  }
}

export const browserTool = new BrowserTool();
