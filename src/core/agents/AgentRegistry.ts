import { IAgent, Capability } from './IAgent';

// Import all 17 AI Agents
import { CareerPlannerAgent } from './plugins/CareerPlannerAgent';
import { ResumeIntelligenceAgent } from './plugins/ResumeIntelligenceAgent';
import { JobDiscoveryAgent } from './plugins/JobDiscoveryAgent';
import { JobIntelligenceAgent } from './plugins/JobIntelligenceAgent';
import { CompanyIntelligenceAgent } from './plugins/CompanyIntelligenceAgent';
import { AIMatchingAgent } from './plugins/AIMatchingAgent';
import { ResumeTailoringAgent } from './plugins/ResumeTailoringAgent';
import { ATSOptimizationAgent } from './plugins/ATSOptimizationAgent';
import { CoverLetterAgent } from './plugins/CoverLetterAgent';
import { PortfolioOptimizationAgent } from './plugins/PortfolioOptimizationAgent';
import { ApplicationDecisionAgent } from './plugins/ApplicationDecisionAgent';
import { BrowserAutomationAgent } from './plugins/BrowserAutomationAgent';
import { EmailIntelligenceAgent } from './plugins/EmailIntelligenceAgent';
import { CalendarAgent } from './plugins/CalendarAgent';
import { InterviewPreparationAgent } from './plugins/InterviewPreparationAgent';
import { LearningAgent } from './plugins/LearningAgent';
import { ReflectionAgent } from './plugins/ReflectionAgent';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, IAgent> = new Map();

  private constructor() {
    this.registerAllDefaultAgents();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  private registerAllDefaultAgents(): void {
    const defaultAgents: IAgent[] = [
      new CareerPlannerAgent(),
      new ResumeIntelligenceAgent(),
      new JobDiscoveryAgent(),
      new JobIntelligenceAgent(),
      new CompanyIntelligenceAgent(),
      new AIMatchingAgent(),
      new ResumeTailoringAgent(),
      new ATSOptimizationAgent(),
      new CoverLetterAgent(),
      new PortfolioOptimizationAgent(),
      new ApplicationDecisionAgent(),
      new BrowserAutomationAgent(),
      new EmailIntelligenceAgent(),
      new CalendarAgent(),
      new InterviewPreparationAgent(),
      new LearningAgent(),
      new ReflectionAgent()
    ];

    for (const agent of defaultAgents) {
      this.register(agent);
    }
  }

  public register(agent: IAgent): void {
    if (this.agents.has(agent.id)) {
      console.warn(`[AgentRegistry] Overwriting registered agent with ID: ${agent.id}`);
    }
    this.agents.set(agent.id, agent);
  }

  public unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  public getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  public findAgentsByCapability(capabilityName: string): IAgent[] {
    const lowerCap = capabilityName.toLowerCase();
    return this.getAllAgents().filter(agent =>
      agent.capabilities.some(c => c.name.toLowerCase().includes(lowerCap) || c.description.toLowerCase().includes(lowerCap))
    );
  }

  public getCapabilitiesList(): { agentId: string; agentName: string; capabilities: Capability[] }[] {
    return this.getAllAgents().map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      capabilities: agent.capabilities
    }));
  }
}

export const agentRegistry = AgentRegistry.getInstance();
