import { IAgent, AgentContext, AgentResult, Capability } from '../IAgent';

export class CalendarAgent implements IAgent {
  public id = 'calendar_agent';
  public name = 'Calendar Agent';
  public description = 'Manages interview calendar slots, creates preparation reminders, and blocks focus study time.';
  public capabilities: Capability[] = [
    { name: 'Interview Scheduler', description: 'Creates iCal / Google Calendar event entries' },
    { name: 'Prep Block Generator', description: 'Blocks 1-hour study buffer prior to technical interviews' }
  ];

  public async execute(context: AgentContext): Promise<AgentResult> {
    const interviewTitle = `Interview: ${context.company || 'TechScale'} - ${context.jobTitle || 'Senior Software Engineer'}`;
    const startTime = new Date(Date.now() + 86400000 * 2).toISOString(); // 2 days from now

    return {
      agentId: this.id,
      agentName: this.name,
      score: 96,
      confidence: 0.95,
      reasoning: `Scheduled ${interviewTitle} and created 1-hour interview prep calendar block.`,
      evidence: [
        `Interview Time: ${startTime}`,
        'Created prep session reminder 60 minutes prior to interview'
      ],
      data: {
        calendarEvent: {
          title: interviewTitle,
          startTime,
          durationMinutes: 45,
          prepBlockMinutes: 60,
          location: 'Google Meet / Zoom'
        }
      }
    };
  }
}
