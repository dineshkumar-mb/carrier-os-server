import { ResumeTruthfulnessGate } from '../../core/gates/ResumeTruthfulnessGate';

export interface ATSCompositeResult {
  atsCompatibilityScore: number;
  truthfulnessScore: number;
  keywordCoverageScore: number;
  requiredSkillsScore: number;
  titleAlignmentScore: number;
  experienceAlignmentScore: number;
  sectionCompletenessScore: number;
  passedTruthfulness: boolean;
  truthfulnessReason: string;
  evidenceMap: Record<string, 'SUPPORTED' | 'REPHRASED' | 'INFERRED' | 'UNSUPPORTED'>;
}

export class ATSOptimizationEngine {
  private static instance: ATSOptimizationEngine;
  private truthfulnessGate: ResumeTruthfulnessGate;

  private constructor() {
    this.truthfulnessGate = new ResumeTruthfulnessGate();
  }

  public static getInstance(): ATSOptimizationEngine {
    if (!ATSOptimizationEngine.instance) {
      ATSOptimizationEngine.instance = new ATSOptimizationEngine();
    }
    return ATSOptimizationEngine.instance;
  }

  public async evaluateTailoredResume(params: {
    masterResumeContent: any;
    tailoredResumeMarkdown: string;
    jobTitle: string;
    jobSkills: string[];
  }): Promise<ATSCompositeResult> {
    const { masterResumeContent, tailoredResumeMarkdown, jobTitle, jobSkills } = params;

    // 1. Evaluate ResumeTruthfulnessGate
    const masterSkills = Array.isArray(masterResumeContent)
      ? masterResumeContent.flatMap((m: any) => m.skills || [])
      : [];
    const masterCompanies = Array.isArray(masterResumeContent)
      ? masterResumeContent.map((m: any) => m.company || '')
      : [];
    const masterTitles = Array.isArray(masterResumeContent)
      ? masterResumeContent.map((m: any) => m.title || '')
      : [];

    const gateResult = ResumeTruthfulnessGate.evaluate({
      masterSkills,
      masterCompanies,
      masterTitles,
      tailoredText: tailoredResumeMarkdown,
      tailoredSkills: jobSkills
    });

    const passedTruthfulness = gateResult.passed;
    const truthfulnessScore = passedTruthfulness ? 100 : 0;
    const truthfulnessReason = gateResult.reason || 'Truthfulness gate evaluation complete.';

    // Build evidence map
    const evidenceMap: Record<string, 'SUPPORTED' | 'REPHRASED' | 'INFERRED' | 'UNSUPPORTED'> = {};
    const textLower = tailoredResumeMarkdown.toLowerCase();

    for (const skill of jobSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        evidenceMap[skill] = passedTruthfulness ? 'SUPPORTED' : 'UNSUPPORTED';
      }
    }

    // 2. Calculate ATS sub-scores deterministically
    let matchedSkillsCount = 0;
    for (const skill of jobSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        matchedSkillsCount++;
      }
    }

    const requiredSkillsScore = jobSkills.length > 0
      ? Math.round((matchedSkillsCount / jobSkills.length) * 100)
      : 85;

    const keywordCoverageScore = Math.min(100, Math.round(requiredSkillsScore * 0.95 + 5));

    const titleAlignmentScore = textLower.includes(jobTitle.toLowerCase()) ? 95 : 70;
    const experienceAlignmentScore = 90;
    const sectionCompletenessScore = (textLower.includes('experience') && textLower.includes('skills') && textLower.includes('education')) ? 100 : 75;

    // Composite score
    const atsCompatibilityScore = Math.round(
      requiredSkillsScore * 0.35 +
      keywordCoverageScore * 0.25 +
      titleAlignmentScore * 0.15 +
      experienceAlignmentScore * 0.15 +
      sectionCompletenessScore * 0.10
    );

    return {
      atsCompatibilityScore,
      truthfulnessScore,
      keywordCoverageScore,
      requiredSkillsScore,
      titleAlignmentScore,
      experienceAlignmentScore,
      sectionCompletenessScore,
      passedTruthfulness,
      truthfulnessReason,
      evidenceMap
    };
  }
}
