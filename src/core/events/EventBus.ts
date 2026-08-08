import { EventEmitter } from 'events';

export type SystemEventType =
  | 'ResumeGenerated'
  | 'ATSCalculated'
  | 'DebateCompleted'
  | 'InterviewPredicted'
  | 'SkillGapAnalyzed'
  | 'ApplicationSubmitted'
  | 'ApplicationStatusChanged'
  | 'CareerHealthCalculated'
  | 'ExecutionGraphUpdated'
  | 'ResumeUploaded'
  | 'JobsDiscovered';

export interface SystemEventPayload {
  eventType: SystemEventType;
  userId: string;
  timestamp: Date;
  jobId?: string;
  data: Record<string, any>;
}

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public publish(event: SystemEventPayload): void {
    console.log(`[EventBus] 📢 Event Published: ${event.eventType} for User ${event.userId}`);
    this.emit(event.eventType, event);
    this.emit('*', event);
  }

  public subscribe(eventType: SystemEventType | '*', handler: (event: SystemEventPayload) => void): void {
    this.on(eventType, handler);
  }
}

export const eventBus = EventBus.getInstance();
