import { aiProvider, safeJsonParse } from '../ai/aiClient';

/**
 * Generates 8–12 intelligent, diversified search queries from a candidate's career profile.
 * Includes role variations, seniority prefixes, and location-specific variants.
 */
export const generateSearchQueries = async (profile: any): Promise<string[]> => {
  try {
    const roles = [profile.primaryRole, profile.secondaryRole].filter(Boolean);
    const skills = (profile.skills || []).slice(0, 10);
    const seniority = profile.seniority || '';
    const yearsOfExp = profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : '';
    const preferredCountries = (profile.preferredCountries || []).slice(0, 3);
    const preferredCities = (profile.preferredCities || []).slice(0, 3);
    const remotePreference = profile.remotePreference || 'Remote';
    const memory = profile.memoryContext || '';

    const prompt = `
You are an expert tech recruiter who deeply understands software engineering roles.

CANDIDATE PROFILE:
- Primary Role: ${roles[0] || 'Software Engineer'}
- Secondary Role: ${roles[1] || ''}
- Seniority Level: ${seniority || 'Mid-level'}
- Years of Experience: ${yearsOfExp}
- Core Skills: ${skills.join(', ')}
- Remote Preference: ${remotePreference}
- Preferred Countries: ${preferredCountries.join(', ') || 'Any'}
- Preferred Cities: ${preferredCities.join(', ') || 'Any'}
- Career Memory / Outcomes: ${memory}

TASK:
Generate 8 to 12 DISTINCT job search queries for use on job boards like Remotive, Himalayas, and ArbeitNow.

REQUIREMENTS:
1. Include role variation queries: different titles for the same role (e.g. "React Developer", "Frontend Engineer", "JavaScript Engineer", "UI Engineer")
2. Include seniority variants: "${seniority || 'Senior'} ${roles[0] || 'engineer'}", "Lead ${roles[0] || 'engineer'}", "Staff Engineer"
3. Include skill-focused queries: pick 2-3 core skills and pair them ("react typescript remote", "node.js backend engineer")
4. Include location variants if applicable: "${roles[0]} ${preferredCities[0] || ''}", "${roles[0]} ${preferredCountries[0] || ''}"
5. Include a remote-specific variant: "${roles[0]} remote work from home"
6. Each query should be 2-5 words — suitable for a search box, NOT a sentence.
7. No punctuation, no special characters.
8. Return ONLY a JSON array of strings.

Example output format:
[
  "react developer frontend",
  "senior frontend engineer remote",
  "typescript react node",
  "javascript engineer full stack",
  "frontend developer bangalore",
  "react remote work from home",
  "ui engineer typescript",
  "staff frontend engineer"
]
`;

    const systemPrompt = `You are a recruitment search specialist. Generate diverse, high-quality job search queries. Return ONLY valid JSON arrays.`;

    const response = await aiProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      { jsonMode: true }
    );

    const parsed = safeJsonParse(response);

    if (Array.isArray(parsed)) {
      const queries = parsed
        .map((q: any) => String(q).trim().toLowerCase())
        .filter(q => q.length > 2 && q.length < 60)
        .slice(0, 12);

      return queries.length > 0 ? queries : _buildFallbackQueries(profile);
    }

    return _buildFallbackQueries(profile);
  } catch (err) {
    console.error('[QueryGenerator] AI query generation failed, using fallback:', err);
    return _buildFallbackQueries(profile);
  }
};

/**
 * Deterministic fallback queries built from profile fields directly.
 * No AI call — always succeeds.
 */
const _buildFallbackQueries = (profile: any): string[] => {
  const role = (profile.primaryRole || 'software engineer').toLowerCase();
  const skills = (profile.skills || []).slice(0, 3).map((s: string) => s.toLowerCase());
  const seniority = (profile.seniority || '').toLowerCase();

  const queries: string[] = [
    role,
    `${seniority} ${role}`.trim(),
    `${role} remote`,
    ...skills.map((s: string) => `${s} developer`),
    `${skills[0] || ''} ${skills[1] || ''}`.trim(),
    `${role} engineer`,
  ];

  return [...new Set(queries.filter(q => q.length > 2))].slice(0, 8);
};
