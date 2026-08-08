import { EventEmitter } from 'events';

export type RuntimeEventCategory = 
  | 'Workflow' | 'Planning' | 'Scheduler' | 'Gate' 
  | 'Runtime' | 'Agent' | 'Tool' | 'Memory' 
  | 'Policy' | 'Artifact' | 'Notification' | 'System';

export type RuntimeEventAction = 
  | 'Started' | 'Passed' | 'Failed' | 'Completed' | 'Retry' | 'Error' | 'Updated';

export type RuntimeEventName = `${RuntimeEventCategory}:${RuntimeEventAction}` | string;

export interface RuntimeEventPayload {
  executionId: string;
  workflowId?: string;
  nodeId?: string;
  gateName?: string;
  toolName?: string;
  timestamp: Date;
  details?: any;
}

class RuntimeEventEmitter extends EventEmitter {
  public emitEvent(name: RuntimeEventName, payload: Omit<RuntimeEventPayload, 'timestamp'>) {
    const fullPayload: RuntimeEventPayload = {
      ...payload,
      timestamp: new Date()
    };
    
    // In the future, this can be wired to emit to the Live Dashboard (Socket.io)
    console.log(`[RuntimeEvent] ${name} | Execution: ${payload.executionId}`, fullPayload.details || '');
    this.emit(name, fullPayload);
  }
}

export const runtimeEvents = new RuntimeEventEmitter();
