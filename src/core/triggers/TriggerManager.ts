import { eventBus, SystemEventPayload } from '../events/EventBus';
import { workflowRegistry } from '../workflows/WorkflowRegistry';
import { plannerAgent } from '../agents/PlannerAgent';
import { scheduler } from '../runtime/Scheduler';

export type TriggerEventType =
  | 'ResumeUploaded'
  | 'JobsDiscovered'
  | 'EmailReceived'
  | 'InterviewScheduled'
  | 'DailyScanTriggered';

export class TriggerManager {
  private static instance: TriggerManager;

  private constructor() {
    this.initListeners();
  }

  public static getInstance(): TriggerManager {
    if (!TriggerManager.instance) {
      TriggerManager.instance = new TriggerManager();
    }
    return TriggerManager.instance;
  }

  private initListeners(): void {
    eventBus.subscribe('*', async (event: SystemEventPayload) => {
      console.log(`[TriggerManager] 🔔 Event Received: "${event.eventType}"`);
      await this.handleTrigger(event.eventType as TriggerEventType, event);
    });
  }

  public async handleTrigger(triggerType: TriggerEventType, payload: SystemEventPayload): Promise<void> {
    console.log(`[TriggerManager] ⚡ Evaluating Trigger Action for: "${triggerType}"`);

    if (triggerType === 'ResumeUploaded') {
      const workflow = workflowRegistry.getWorkflow('workflow_resume_audit');
      if (workflow) {
        console.log(`[TriggerManager] 🚀 Launching Master Resume Audit Workflow...`);
        const dag = workflow.buildDAG(payload.data);
        await scheduler.scheduleAndExecute({
          executionId: `trigger_${Date.now()}`,
          workflowId: 'workflow_resume_audit',
          user: { _id: payload.userId },
          // The rest of ExecutionContext fields will be injected by the provider in a future phase
        } as any, dag);
      }
    } else if (triggerType === 'JobsDiscovered') {
      const workflow = workflowRegistry.getWorkflow('workflow_apply_job');
      if (workflow && payload.data?.jobId) {
        console.log(`[TriggerManager] 🚀 Launching ApplyToJob Workflow for Job: ${payload.data.jobId}`);
        const dag = workflow.buildDAG(payload.data);
        await scheduler.scheduleAndExecute({
          executionId: `trigger_${Date.now()}`,
          workflowId: 'workflow_apply_job',
          user: { _id: payload.userId },
          job: { id: payload.data.jobId }
        } as any, dag);
      }
    }
  }
}

export const triggerManager = TriggerManager.getInstance();
