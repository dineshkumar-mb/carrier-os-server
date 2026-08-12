import crypto from 'crypto';
import { EvidenceItem, EvidenceType, EvidenceStrength, EvidenceProvenance } from './JobVerificationTypes';

export class JobEvidenceService {
  private static instance: JobEvidenceService;

  private constructor() {}

  public static getInstance(): JobEvidenceService {
    if (!JobEvidenceService.instance) {
      JobEvidenceService.instance = new JobEvidenceService();
    }
    return JobEvidenceService.instance;
  }

  public computeContentHash(content: {
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    applicationUrl?: string;
    requisitionId?: string;
  }): string {
    const raw = `${content.title.trim().toLowerCase()}|${content.company.trim().toLowerCase()}|${content.location.trim().toLowerCase()}|${content.url.trim()}|${(content.applicationUrl || '').trim()}|${(content.requisitionId || '').trim()}|${content.description.trim()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public computeFingerprint(title: string, company: string, location: string, url: string): string {
    const normalizedCompany = company.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const hostname = this.extractHostname(url);
    const raw = `${normalizedCompany}:${normalizedTitle}:${hostname}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public createEvidenceItem(params: {
    type: EvidenceType;
    strength: EvidenceStrength;
    provenance: EvidenceProvenance;
    sourceUrl?: string;
    sourceProvider?: string;
    details?: string;
    contentHash?: string;
  }): EvidenceItem {
    const randomId = crypto.randomBytes(8).toString('hex');
    return {
      id: `ev_${randomId}`,
      type: params.type,
      strength: params.strength,
      provenance: params.provenance,
      sourceUrl: params.sourceUrl,
      sourceProvider: params.sourceProvider,
      observedAt: new Date(),
      contentHash: params.contentHash,
      details: params.details
    };
  }

  public extractHostname(urlStr: string): string {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return 'invalid-domain';
    }
  }

  public extractCompanyDomain(companyName: string): string {
    const cleaned = companyName.toLowerCase()
      .replace(/inc\.|llc|corp\.|corporation|technologies|tech|ltd\.|limited|gmbh|co\./g, '')
      .trim()
      .replace(/[^a-z0-9]/g, '');
    return `${cleaned}.com`;
  }
}
