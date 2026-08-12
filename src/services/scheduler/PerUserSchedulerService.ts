import { TenantContext } from '../../core/tenant/TenantContext';
import { AutonomousEngineService, AutonomousCycleResult } from '../../core/services/AutonomousEngineService';

export interface UserScheduleConfig {
  userId: string;
  tenantId: string;
  intervalMinutes: number;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export class PerUserSchedulerService {
  private static instance: PerUserSchedulerService;
  private userSchedules: Map<string, UserScheduleConfig> = new Map();
  private userTimers: Map<string, NodeJS.Timeout> = new Map();
  private autonomousEngine: AutonomousEngineService;

  private constructor() {
    this.autonomousEngine = AutonomousEngineService.getInstance();
  }

  public static getInstance(): PerUserSchedulerService {
    if (!PerUserSchedulerService.instance) {
      PerUserSchedulerService.instance = new PerUserSchedulerService();
    }
    return PerUserSchedulerService.instance;
  }

  public scheduleUserLoop(tenantContext: TenantContext, intervalMinutes: number = 30): void {
    const userId = tenantContext.userId;

    this.stopUserLoop(userId);

    const config: UserScheduleConfig = {
      userId,
      tenantId: tenantContext.tenantId,
      intervalMinutes,
      enabled: true,
      nextRunAt: new Date(Date.now() + intervalMinutes * 60 * 1000)
    };

    this.userSchedules.set(userId, config);

    console.log(`[PerUserSchedulerService] 🚀 Scheduled independent autonomous career loop for User '${userId}' (Interval: ${intervalMinutes}m)`);

    const timer = setInterval(() => {
      this.runUserCycle(tenantContext).catch(console.error);
    }, intervalMinutes * 60 * 1000);

    this.userTimers.set(userId, timer);
  }

  public stopUserLoop(userId: string): void {
    const existing = this.userTimers.get(userId);
    if (existing) {
      clearInterval(existing);
      this.userTimers.delete(userId);
    }
    const cfg = this.userSchedules.get(userId);
    if (cfg) {
      cfg.enabled = false;
    }
  }

  public async runUserCycle(tenantContext: TenantContext): Promise<AutonomousCycleResult> {
    const userId = tenantContext.userId;
    const cfg = this.userSchedules.get(userId);

    if (cfg) {
      cfg.lastRunAt = new Date();
      cfg.nextRunAt = new Date(Date.now() + cfg.intervalMinutes * 60 * 1000);
    }

    console.log(`[PerUserSchedulerService] ⚡ Executing isolated career loop for User '${userId}'...`);
    return await this.autonomousEngine.runCycle(tenantContext);
  }

  public getUserSchedule(userId: string): UserScheduleConfig | undefined {
    return this.userSchedules.get(userId);
  }

  public getAllUserSchedules(): UserScheduleConfig[] {
    return Array.from(this.userSchedules.values());
  }
}
