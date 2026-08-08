export interface Capability {
  name: string;
  description: string;
}

export interface AgentResult {
  agentId: string;
  agentName: string;
  score: number; // 0 - 100
  confidence: number; // 0.0 - 1.0 (e.g. 0.85)
  reasoning: string;
  evidence: string[];
  data?: Record<string, any>;
}

export interface AgentContext {
  userId: string;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  resumeData?: any;
  userProfile?: any;
  customParams?: Record<string, any>;
}

export interface IAgent {
  id: string;
  name: string;
  description: string;
  capabilities: Capability[];
  execute(context: AgentContext): Promise<AgentResult>;
}
