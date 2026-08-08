export type ResumeVariantType = 'keyword_heavy' | 'achievement_focused' | 'project_focused';

export interface ResumeVariantPerformance {
  variantId: string;
  variantName: ResumeVariantType;
  description: string;
  timesUsed: number;
  interviewsTriggered: number;
  conversionRate: number; // %
  averageATSScore: number;
}

export class ABTestingService {
  private static instance: ABTestingService;
  private variants: Map<ResumeVariantType, ResumeVariantPerformance> = new Map();

  private constructor() {
    this.seedVariants();
  }

  public static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  private seedVariants() {
    this.variants.set('keyword_heavy', {
      variantId: 'var-1',
      variantName: 'keyword_heavy',
      description: 'Maximizes ATS keyword matching and skill taxonomy density',
      timesUsed: 20,
      interviewsTriggered: 5,
      conversionRate: 25.0,
      averageATSScore: 95.4
    });

    this.variants.set('achievement_focused', {
      variantId: 'var-2',
      variantName: 'achievement_focused',
      description: 'Highlights quantifiable metric impact and leadership metrics',
      timesUsed: 15,
      interviewsTriggered: 3,
      conversionRate: 20.0,
      averageATSScore: 91.2
    });

    this.variants.set('project_focused', {
      variantId: 'var-3',
      variantName: 'project_focused',
      description: 'Emphasizes complex open-source repos, architecture, and live demos',
      timesUsed: 7,
      interviewsTriggered: 1,
      conversionRate: 14.3,
      averageATSScore: 89.0
    });
  }

  public getVariants(): ResumeVariantPerformance[] {
    return Array.from(this.variants.values());
  }

  public selectBestVariant(targetJobCategory: string): ResumeVariantType {
    const sorted = this.getVariants().sort((a, b) => b.conversionRate - a.conversionRate);
    return sorted[0]?.variantName || 'keyword_heavy';
  }

  public recordOutcome(variantName: ResumeVariantType, passedToInterview: boolean, atsScore: number) {
    const v = this.variants.get(variantName);
    if (!v) return;

    v.timesUsed += 1;
    if (passedToInterview) v.interviewsTriggered += 1;
    v.conversionRate = Number(((v.interviewsTriggered / v.timesUsed) * 100).toFixed(1));
    v.averageATSScore = Number((((v.averageATSScore * (v.timesUsed - 1)) + atsScore) / v.timesUsed).toFixed(1));
  }
}
