import { ITool, ToolExecutionResult } from './ITool';

import { BrowserTool } from './plugins/BrowserTool';
import { DatabaseTool } from './plugins/DatabaseTool';
import { SearchTool } from './plugins/SearchTool';
import { EmailTool } from './plugins/EmailTool';
import { CalendarTool } from './plugins/CalendarTool';
import { PDFGeneratorTool } from './plugins/PDFGeneratorTool';
import { DOCXGeneratorTool } from './plugins/DOCXGeneratorTool';
import { LinkedInTool } from './plugins/LinkedInTool';
import { GitHubTool } from './plugins/GitHubTool';
import { PortfolioTool } from './plugins/PortfolioTool';
import { NotificationTool } from './plugins/NotificationTool';
import { AIModelTool } from './plugins/AIModelTool';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ITool> = new Map();

  private constructor() {
    this.registerAllDefaultTools();
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private registerAllDefaultTools(): void {
    const defaultTools: ITool[] = [
      new BrowserTool(),
      new DatabaseTool(),
      new SearchTool(),
      new EmailTool(),
      new CalendarTool(),
      new PDFGeneratorTool(),
      new DOCXGeneratorTool(),
      new LinkedInTool(),
      new GitHubTool(),
      new PortfolioTool(),
      new NotificationTool(),
      new AIModelTool()
    ];

    for (const tool of defaultTools) {
      this.register(tool);
    }
  }

  public register(tool: ITool): void {
    if (this.tools.has(tool.id)) {
      console.warn(`[ToolRegistry] Overwriting tool registration for: ${tool.id}`);
    }
    this.tools.set(tool.id, tool);
  }

  public getTool(toolId: string): ITool | undefined {
    return this.tools.get(toolId);
  }

  public getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(toolId: string, params: any): Promise<ToolExecutionResult> {
    const tool = this.getTool(toolId);
    if (!tool) {
      return {
        toolId,
        success: false,
        error: `Tool not found in ToolRegistry: ${toolId}`,
        executionTimeMs: 0
      };
    }

    const start = Date.now();
    try {
      const result = await tool.execute(params);
      return result;
    } catch (err: any) {
      return {
        toolId,
        success: false,
        error: err.message,
        executionTimeMs: Date.now() - start
      };
    }
  }
}

export const toolRegistry = ToolRegistry.getInstance();
