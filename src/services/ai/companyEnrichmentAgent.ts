import { aiProvider, safeJsonParse } from './aiClient';
import { CompanyProfile } from '../../models/CompanyProfile';

const CACHE_TTL_HOURS = 24;

/**
 * Enriches a company's profile using AI research.
 * Results are cached in MongoDB CompanyProfile.
 * If the profile was researched within CACHE_TTL_HOURS, it is returned from cache.
 */
export const enrichCompany = async (companyName: string): Promise<void> => {
  if (!companyName || companyName === 'Unknown Company') return;

  try {
    // Check cache
    const existing = await CompanyProfile.findOne({ companyName });
    if (existing) {
      const ageHours = (Date.now() - existing.lastResearched!.getTime()) / (1000 * 60 * 60);
      if (ageHours < CACHE_TTL_HOURS) {
        return; // Fresh cache — skip AI call
      }
    }

    console.log(`[CompanyEnrichment] Researching: ${companyName}`);

    const prompt = `
Research the following company from publicly known information:

Company: ${companyName}

Extract and return a structured JSON object with:
1. mission: A 1-2 sentence description of what the company does and its mission.
2. products: Array of up to 5 main products or services.
3. techStack: Array of known technologies they use (languages, frameworks, infra, etc.).
4. engineeringCulture: 1-2 sentences describing their engineering culture if known.
5. hiringValues: Array of up to 5 things they typically value in candidates.
6. latestNews: Array of up to 3 recent notable facts about the company.

Return ONLY valid JSON matching this schema:
{
  "mission": "string",
  "products": ["string"],
  "techStack": ["string"],
  "engineeringCulture": "string",
  "hiringValues": ["string"],
  "latestNews": ["string"]
}

If you have no reliable information about the company, return all strings as empty and all arrays as empty.
`;

    const response = await aiProvider.chat(
      [
        { role: 'system', content: 'You are a business intelligence researcher. Return accurate structured JSON based on publicly known information only.' },
        { role: 'user', content: prompt },
      ],
      { jsonMode: true, maxTokens: 800 }
    );

    const parsed = safeJsonParse(response);
    if (!parsed) {
      console.warn(`[CompanyEnrichment] Could not parse AI response for "${companyName}"`);
      return;
    }

    // Upsert into MongoDB
    await CompanyProfile.findOneAndUpdate(
      { companyName },
      {
        companyName,
        mission: parsed.mission || '',
        products: parsed.products || [],
        techStack: parsed.techStack || [],
        engineeringCulture: parsed.engineeringCulture || '',
        hiringValues: parsed.hiringValues || [],
        latestNews: parsed.latestNews || [],
        lastResearched: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log(`[CompanyEnrichment] Saved profile for: ${companyName}`);
  } catch (err) {
    // Enrichment failure is non-fatal
    console.warn(`[CompanyEnrichment] Failed for "${companyName}":`, (err as Error).message);
  }
};
