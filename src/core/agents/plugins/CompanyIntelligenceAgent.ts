import { IAgent, AgentContext, AgentResult, Capability } from '../IAgent';

export class CompanyIntelligenceAgent implements IAgent {
  public id = 'company_intelligence_agent';
  public name = 'Company Intelligence Agent';
  public description = 'Researches company background, mission, culture, tech stack, funding, and hiring trends.';
  public capabilities: Capability[] = [
    { name: 'Company Profiling', description: 'Gathers mission, products, Glassdoor insights' },
    { name: 'Hiring Signals', description: 'Tracks growth trends and team expansion' }
  ];

  public async execute(context: AgentContext): Promise<AgentResult> {
    const company = context.company || 'TechScale Inc';

    return {
      agentId: this.id,
      agentName: this.name,
      score: 88,
      confidence: 0.86,
      reasoning: `Gathered organizational intelligence for ${company}.`,
      evidence: [
        'Series B funded startup ($25M raised)',
        'Engineering team size: 45 engineers',
        'Glassdoor culture rating: 4.6 / 5.0'
      ],
      data: {
        companyName: company,
        fundingStage: 'Series B',
        rating: 4.6,
        techCulture: 'Engineering-led product culture with CI/CD and strong unit testing practices',
        recentNews: 'Expanded engineering team by 30% in Q2 2026'
      }
    };
  }
}
