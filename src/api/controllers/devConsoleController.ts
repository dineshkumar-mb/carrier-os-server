import { Request, Response } from 'express';
import { agentRegistry } from '../../core/agents/AgentRegistry';
import { toolRegistry } from '../../core/tools/ToolRegistry';
import { ExecutionPlan } from '../../models/ExecutionPlan';
import { tieredMemoryService } from '../../services/memory/TieredMemoryService';

export const getDevRegistry = async (req: Request, res: Response) => {
  try {
    const agents = agentRegistry.getCapabilitiesList();
    res.json({ count: agents.length, agents });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getDevTools = async (req: Request, res: Response) => {
  try {
    const tools = toolRegistry.getAllTools().map(t => ({
      id: t.id,
      metadata: t.metadata
    }));
    res.json({ count: tools.length, tools });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getDevExecutions = async (req: Request, res: Response) => {
  try {
    const executions = await ExecutionPlan.find().sort({ createdAt: -1 }).limit(20);
    res.json({ count: executions.length, executions });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getDevMemory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id?.toString() || 'user_dev';
    const episodic = tieredMemoryService.getEpisodicMemories(userId);
    const semantic = tieredMemoryService.getSemanticMemories(userId);
    const session = tieredMemoryService.getSessionMemory(userId);

    res.json({
      userId,
      episodicCount: episodic.length,
      semanticCount: semantic.length,
      episodic,
      semantic,
      session
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
