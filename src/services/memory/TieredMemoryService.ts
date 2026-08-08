export interface TieredMemoryRecord {
  id: string;
  userId: string;
  tier: 'working' | 'session' | 'episodic' | 'semantic';
  key: string;
  value: any;
  ttlMs?: number;
  createdAt: Date;
}

export class TieredMemoryService {
  private static instance: TieredMemoryService;
  private workingMemory: Map<string, Map<string, any>> = new Map();
  private sessionMemory: Map<string, Map<string, any>> = new Map();
  private episodicMemory: Map<string, TieredMemoryRecord[]> = new Map();
  private semanticMemory: Map<string, TieredMemoryRecord[]> = new Map();

  private constructor() {}

  public static getInstance(): TieredMemoryService {
    if (!TieredMemoryService.instance) {
      TieredMemoryService.instance = new TieredMemoryService();
    }
    return TieredMemoryService.instance;
  }

  // Working Memory (Short-Lived for task execution)
  public setWorkingMemory(taskId: string, key: string, value: any): void {
    if (!this.workingMemory.has(taskId)) {
      this.workingMemory.set(taskId, new Map());
    }
    this.workingMemory.get(taskId)!.set(key, value);
  }

  public getWorkingMemory(taskId: string, key: string): any {
    return this.workingMemory.get(taskId)?.get(key);
  }

  public clearWorkingMemory(taskId: string): void {
    this.workingMemory.delete(taskId);
  }

  // Session Memory
  public setSessionMemory(sessionId: string, key: string, value: any): void {
    if (!this.sessionMemory.has(sessionId)) {
      this.sessionMemory.set(sessionId, new Map());
    }
    this.sessionMemory.get(sessionId)!.set(key, value);
  }

  public getSessionMemory(sessionId: string): Record<string, any> {
    const map = this.sessionMemory.get(sessionId);
    if (!map) return {};
    return Object.fromEntries(map.entries());
  }

  // Episodic Memory (Events/Outcomes)
  public addEpisodicMemory(userId: string, eventKey: string, payload: any): TieredMemoryRecord {
    const userRecords = this.episodicMemory.get(userId) || [];
    const record: TieredMemoryRecord = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      tier: 'episodic',
      key: eventKey,
      value: payload,
      createdAt: new Date()
    };
    userRecords.push(record);
    this.episodicMemory.set(userId, userRecords);
    console.log(`[TieredMemory] 🧠 Saved Episodic Memory: "${eventKey}" for User ${userId}`);
    return record;
  }

  public getEpisodicMemories(userId: string): TieredMemoryRecord[] {
    return this.episodicMemory.get(userId) || [];
  }

  // Semantic Memory (Long-term Facts & Insights)
  public addSemanticMemory(userId: string, key: string, fact: string): TieredMemoryRecord {
    const userRecords = this.semanticMemory.get(userId) || [];
    const record: TieredMemoryRecord = {
      id: `sem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      tier: 'semantic',
      key,
      value: fact,
      createdAt: new Date()
    };
    userRecords.push(record);
    this.semanticMemory.set(userId, userRecords);
    console.log(`[TieredMemory] 🧠 Saved Semantic Memory: "${key}" for User ${userId}`);
    return record;
  }

  public getSemanticMemories(userId: string): TieredMemoryRecord[] {
    return this.semanticMemory.get(userId) || [];
  }
}

export const tieredMemoryService = TieredMemoryService.getInstance();
