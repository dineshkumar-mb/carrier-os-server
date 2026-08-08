import { ITool, ToolMetadata, ToolExecutionResult } from '../ITool';

export class CalendarTool implements ITool {
  public id = 'calendar_tool';
  public metadata: ToolMetadata = {
    name: 'Calendar Tool',
    description: 'Schedules interview slots and manages prep buffer calendar entries.',
    parametersSchema: {
      action: { type: 'string', enum: ['create_event', 'get_events'] },
      title: { type: 'string' },
      startTime: { type: 'string' },
      durationMinutes: { type: 'number' }
    }
  };

  public async execute(params: any): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    return {
      toolId: this.id,
      success: true,
      output: {
        eventId: `cal-evt-${Date.now()}`,
        status: 'CONFIRMED',
        title: params.title || 'Tech Screener',
        startTime: params.startTime || new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: params.durationMinutes || 45
      },
      executionTimeMs: Date.now() - startTime
    };
  }
}
