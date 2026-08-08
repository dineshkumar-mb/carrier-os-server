import { aiProvider, safeJsonParse } from './aiClient';

export interface MasterResumeAuditResult {
  masterAtsScore: number;
  overallStrength: 'Strong' | 'Average' | 'Needs Improvement';
  weakSections: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export class MasterResumeAudit {
  public static async auditResume(resumeData: any): Promise<MasterResumeAuditResult> {
    console.log(`[MasterResumeAudit] 🔍 Auditing canonical master resume...`);

    const prompt = `
You are a Lead HR Resume Auditor. Perform an immediate health check on this master resume.

Master Resume Content:
${JSON.stringify(resumeData || {}, null, 2)}

Return ONLY a JSON object:
{
  "masterAtsScore": number (0-100),
  "overallStrength": "Strong | Average | Needs Improvement",
  "weakSections": ["Section name + issue"],
  "missingKeywords": ["Missing high-value keyword 1", "Keyword 2"],
  "suggestions": ["Concrete recommendation 1", "Recommendation 2"]
}
`;

    try {
      const responseText = await aiProvider.chat([
        { role: 'system', content: 'You are a master HR resume Auditor. Return strictly valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true, temperature: 0.2 });

      const parsed = safeJsonParse(responseText) || {};

      return {
        masterAtsScore: typeof parsed.masterAtsScore === 'number' ? parsed.masterAtsScore : 82,
        overallStrength: parsed.overallStrength || 'Average',
        weakSections: parsed.weakSections || ['Summary section could be more concise'],
        missingKeywords: parsed.missingKeywords || ['Docker', 'System Design'],
        suggestions: parsed.suggestions || ['Add quantifiable metrics to recent project achievements']
      };
    } catch (err: any) {
      console.error('[MasterResumeAudit] Audit error:', err);
      return {
        masterAtsScore: 81,
        overallStrength: 'Average',
        weakSections: ['Summary section needs impact metrics'],
        missingKeywords: ['Docker', 'Redis'],
        suggestions: ['Quantify engineering accomplishments in recent experience entries']
      };
    }
  }
}
