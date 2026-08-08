export interface MemoryRecord {
  id: string;
  userId: string;
  category: 'resume' | 'company' | 'recruiter' | 'interview' | 'learning';
  key: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class MemoryService {
  private memories: Map<string, MemoryRecord[]> = new Map();

  public saveMemory(userId: string, category: MemoryRecord['category'], key: string, content: string, metadata?: Record<string, any>): MemoryRecord {
    const userMemories = this.memories.get(userId) || [];
    const record: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      category,
      key,
      content,
      metadata,
      createdAt: new Date()
    };
    userMemories.push(record);
    this.memories.set(userId, userMemories);
    console.log(`[MemoryService] 🧠 Saved long-term memory [${category}] "${key}" for user ${userId}`);
    return record;
  }

  public getMemories(userId: string, category?: MemoryRecord['category']): MemoryRecord[] {
    const list = this.memories.get(userId) || [];
    if (category) {
      return list.filter(m => m.category === category);
    }
    return list;
  }

  public queryMemories(userId: string, searchTerm: string): MemoryRecord[] {
    const list = this.getMemories(userId);
    const term = searchTerm.toLowerCase();
    return list.filter(m =>
      m.key.toLowerCase().includes(term) ||
      m.content.toLowerCase().includes(term) ||
      m.category.toLowerCase().includes(term)
    );
  }
}

export const memoryService = new MemoryService();
