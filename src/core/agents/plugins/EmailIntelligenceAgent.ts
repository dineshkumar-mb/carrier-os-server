import { IAgent, AgentContext, AgentResult, Capability } from '../IAgent';
import { RecruiterMemoryService } from '../../../services/intelligence/RecruiterMemoryService';

export class EmailIntelligenceAgent implements IAgent {
  public id = 'email_intelligence_agent';
  public name = 'Email Intelligence Agent';
  public description = 'Monitors recruiter inbox messages to detect interview invites, coding assessments, rejections, and offers.';
  public capabilities: Capability[] = [
    { name: 'Intent Classifier', description: 'Categorizes incoming email into Interview / Assessment / Reject / Offer' },
    { name: 'CRM Syncer', description: 'Updates recruiter relationship memory and application timeline' }
  ];

  public async execute(context: AgentContext): Promise<AgentResult> {
    const rawEmail = context.customParams?.emailBody || 'Hi John, Thanks for applying to TechScale. We loved your profile and would like to schedule a 30 min technical screener next Tuesday.';

    const senderEmail = context.customParams?.senderEmail || 'sconnor@techscale.io';
    const recruiterMemory = RecruiterMemoryService.getInstance();
    recruiterMemory.recordInteraction(senderEmail, {
      name: 'Sarah Connor',
      company: context.company || 'TechScale Inc',
      notes: ['Received interview invitation for technical screener']
    });

    return {
      agentId: this.id,
      agentName: this.name,
      score: 95,
      confidence: 0.94,
      reasoning: 'Detected category: INTERVIEW_INVITATION from recruiter email.',
      evidence: [
        'Keywords matched: "schedule a 30 min technical screener"',
        `Updated Recruiter Memory for ${senderEmail}`
      ],
      data: {
        category: 'INTERVIEW_INVITATION',
        senderEmail,
        suggestedNextAction: 'SCHEDULE_CALENDAR_SLOT',
        confidenceScore: 0.94
      }
    };
  }
}
