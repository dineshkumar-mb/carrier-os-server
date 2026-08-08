import { aiProvider, cleanJsonString } from './aiClient';
import { CompanyProfile } from '../../models/CompanyProfile';
import { emitLiveActivity } from '../../config/socket';

export const researchCompany = async (companyName: string): Promise<any> => {
  try {
    // 1. Check cache first
    const cached = await CompanyProfile.findOne({ companyName });
    if (cached) {
      const cacheAgeMs = Date.now() - new Date(cached.updatedAt || '').getTime();
      const cacheMaxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days cache
      if (cacheAgeMs < cacheMaxAgeMs) {
        console.log(`[CompanyIntelligence] Cache hit for "${companyName}"`);
        return cached;
      }
    }

    await emitLiveActivity(`[Company Intelligence] Researching company "${companyName}"...`);

    const prompt = `
    Company Name: ${companyName}
    
    Please research and compile professional details about this company.
    If it is a simulated/mock company name, generate highly realistic startup details.
    
    Return ONLY a JSON object matching this schema:
    {
      "products": ["string"],
      "services": ["string"],
      "mission": "string",
      "engineeringCulture": "string",
      "techStack": ["string"],
      "latestNews": ["string"],
      "hiringValues": ["string"]
    }
    `;

    const systemPrompt = `You are a corporate intelligence analyst. Generate detailed and realistic corporate profile details and output strictly raw valid JSON.`;

    const response = await aiProvider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { jsonMode: true });

    const cleaned = cleanJsonString(response);
    const parsed = JSON.parse(cleaned);

    const profile = await CompanyProfile.findOneAndUpdate(
      { companyName },
      {
        $set: {
          products: parsed.products || [],
          services: parsed.services || [],
          mission: parsed.mission || '',
          engineeringCulture: parsed.engineeringCulture || '',
          techStack: parsed.techStack || [],
          latestNews: parsed.latestNews || [],
          hiringValues: parsed.hiringValues || [],
          lastResearched: new Date()
        }
      },
      { new: true, upsert: true }
    );

    await emitLiveActivity(`[Company Intelligence] Cached profile for "${companyName}".`);
    return profile;
  } catch (error) {
    console.error(`Error researching company "${companyName}":`, error);
    // Return a fallback profile so downstream flows don't break
    return {
      companyName,
      products: [],
      services: [],
      mission: 'Build great products.',
      engineeringCulture: 'High autonomy, remote-first.',
      techStack: ['JavaScript', 'Node.js'],
      latestNews: [],
      hiringValues: ['Customer obsession']
    };
  }
};
