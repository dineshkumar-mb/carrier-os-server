import { TenantContext } from '../../core/tenant/TenantContext';

export interface ResumeStrategyMetric {
  strategyId: 'KEYWORD_HEAVY' | 'ACHIEVEMENT_FOCUSED' | 'PROJECT_FOCUSED';
  name: string;
  minAtsThreshold: number; // Must be >= 80%
  currentAtsScore: number;
  applications: number;
  interviews: number;
  offers: number;
  appConversionRate: number; // Applications / Matches
  interviewConversionRate: number; // Interviews / Applications
  offerConversionRate: number; // Offers / Interviews
  compositeOutcomeScore: number;
  dataStatus: 'SUFFICIENT_DATA' | 'INSUFFICIENT_DATA';
}

export class StrategyLearningEngine {
  private static instance: StrategyLearningEngine;
  private MIN_SAMPLE_SIZE = 20;

  private constructor() {}

  public static getInstance(): StrategyLearningEngine {
    if (!StrategyLearningEngine.instance) {
      StrategyLearningEngine.instance = new StrategyLearningEngine();
    }
    return StrategyLearningEngine.instance;
  }

  public evaluateStrategyHierarchy(tenantContext: TenantContext): ResumeStrategyMetric[] {
    const strategies: ResumeStrategyMetric[] = [
      {
        strategyId: 'KEYWORD_HEAVY',
        name: 'Keyword Heavy (ATS Inflation Strategy)',
        minAtsThreshold: 80,
        currentAtsScore: 96,
        applications: 50,
        interviews: 4,
        offers: 0,
        appConversionRate: 0.90,
        interviewConversionRate: 0.08,
        offerConversionRate: 0.00,
        compositeOutcomeScore: 25,
        dataStatus: 'SUFFICIENT_DATA'
      },
      {
        strategyId: 'ACHIEVEMENT_FOCUSED',
        name: 'Achievement Focused (Quantified Impact Strategy)',
        minAtsThreshold: 80,
        currentAtsScore: 88,
        applications: 40,
        interviews: 9,
        offers: 3,
        appConversionRate: 0.85,
        interviewConversionRate: 0.225,
        offerConversionRate: 0.075,
        compositeOutcomeScore: 88,
        dataStatus: 'SUFFICIENT_DATA'
      },
      {
        strategyId: 'PROJECT_FOCUSED',
        name: 'Project Focused (Technical Artifact Strategy)',
        minAtsThreshold: 80,
        currentAtsScore: 85,
        applications: 5, // Low sample size (< 20)
        interviews: 1,
        offers: 0,
        appConversionRate: 0.80,
        interviewConversionRate: 0.20,
        offerConversionRate: 0.00,
        compositeOutcomeScore: 40,
        dataStatus: 'INSUFFICIENT_DATA'
      }
    ];

    // Filter strategies satisfying minimum ATS constraint threshold (>= 80%)
    const valid = strategies.filter(s => s.currentAtsScore >= s.minAtsThreshold);

    // Sort according to hierarchy: Offer Conversion > Interview Conversion > Application Conversion > ATS Score
    return valid.sort((a, b) => {
      // Prioritize strategies with SUFFICIENT_DATA over INSUFFICIENT_DATA
      if (a.dataStatus !== b.dataStatus) {
        return a.dataStatus === 'SUFFICIENT_DATA' ? -1 : 1;
      }
      if (b.offerConversionRate !== a.offerConversionRate) {
        return b.offerConversionRate - a.offerConversionRate;
      }
      if (b.interviewConversionRate !== a.interviewConversionRate) {
        return b.interviewConversionRate - a.interviewConversionRate;
      }
      return b.currentAtsScore - a.currentAtsScore;
    });
  }

  public getOptimalStrategy(tenantContext: TenantContext): ResumeStrategyMetric {
    const ranked = this.evaluateStrategyHierarchy(tenantContext);
    return ranked[0];
  }
}
