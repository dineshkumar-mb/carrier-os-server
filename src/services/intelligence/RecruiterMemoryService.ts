export interface RecruiterContact {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  linkedInUrl?: string;
  preferredCommunicationStyle?: 'direct' | 'casual' | 'formal';
  totalInteractions: number;
  responseRate: number; // 0 - 100%
  lastContactedAt?: string;
  notes?: string[];
  interviewOutcomes?: Array<{
    jobId: string;
    stage: string;
    passed: boolean;
    feedback?: string;
    date: string;
  }>;
}

export class RecruiterMemoryService {
  private static instance: RecruiterMemoryService;
  private contacts: Map<string, RecruiterContact> = new Map();

  private constructor() {
    this.seedDefaultContacts();
  }

  public static getInstance(): RecruiterMemoryService {
    if (!RecruiterMemoryService.instance) {
      RecruiterMemoryService.instance = new RecruiterMemoryService();
    }
    return RecruiterMemoryService.instance;
  }

  private seedDefaultContacts() {
    const mockRecruiters: RecruiterContact[] = [
      {
        id: 'rec-1',
        name: 'Sarah Connor',
        email: 'sconnor@techscale.io',
        company: 'TechScale Inc',
        title: 'Senior Technical Recruiter',
        preferredCommunicationStyle: 'direct',
        totalInteractions: 4,
        responseRate: 85,
        lastContactedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        notes: ['Prefers concise bullet points', 'Quick to schedule screeners'],
        interviewOutcomes: [
          {
            jobId: 'job-101',
            stage: 'Technical Screen',
            passed: true,
            feedback: 'Strong system design foundation',
            date: new Date(Date.now() - 86400000 * 10).toISOString()
          }
        ]
      },
      {
        id: 'rec-2',
        name: 'Alex Mercer',
        email: 'alex.mercer@cloudcraft.com',
        company: 'CloudCraft AI',
        title: 'Talent Acquisition Partner',
        preferredCommunicationStyle: 'formal',
        totalInteractions: 2,
        responseRate: 60,
        lastContactedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        notes: ['Focused on TypeScript and React proficiency']
      }
    ];

    for (const r of mockRecruiters) {
      this.contacts.set(r.email.toLowerCase(), r);
    }
  }

  public getRecruiterByEmail(email: string): RecruiterContact | undefined {
    return this.contacts.get(email.toLowerCase());
  }

  public recordInteraction(email: string, details: Partial<RecruiterContact>): RecruiterContact {
    const key = email.toLowerCase();
    const existing = this.contacts.get(key) || {
      id: `rec-${Date.now()}`,
      name: details.name || 'Unknown Recruiter',
      email,
      company: details.company || 'Unknown',
      title: details.title || 'Recruiter',
      totalInteractions: 0,
      responseRate: 100,
      notes: []
    };

    existing.totalInteractions += 1;
    if (details.notes) {
      existing.notes = [...(existing.notes || []), ...details.notes];
    }
    existing.lastContactedAt = new Date().toISOString();
    this.contacts.set(key, existing);
    return existing;
  }

  public getAllContacts(): RecruiterContact[] {
    return Array.from(this.contacts.values());
  }
}
