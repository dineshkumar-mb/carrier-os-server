import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Core normalized job input from any provider
// ─────────────────────────────────────────────────────────────────────────────
export interface JobInput {
  title: string;
  company: string;
  description: string;
  url: string;
  location: string;
  country?: string;
  city?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  source: string;
  employmentType?: string;
  remoteStatus?: 'Remote' | 'Hybrid' | 'Onsite';
  postedDate?: Date;
  applicationUrl?: string;
  companyLogo?: string;
  skills?: string[];
}

export { CanonicalJob } from './CanonicalJob';

// ─────────────────────────────────────────────────────────────────────────────
// Provider interface — every data source implements this
// ─────────────────────────────────────────────────────────────────────────────
export interface JobProvider {
  name: string;
  searchJobs(profile: any, query: string, filter?: DiscoveryFilter): Promise<JobInput[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filters that can be applied at the provider or engine level
// ─────────────────────────────────────────────────────────────────────────────
export interface DiscoveryFilter {
  employmentType?: ('Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance')[];
  remoteStatus?: ('Remote' | 'Hybrid' | 'Onsite')[];
  countries?: string[];
  cities?: string[];
  minSalary?: number;
  maxExperienceYears?: number;
  postedWithinDays?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Circuit breaker state per provider
// ─────────────────────────────────────────────────────────────────────────────
export interface ProviderCircuitState {
  failures: number;
  openedAt: number | null;   // timestamp when circuit opened
  isOpen: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: compute a SHA-256 dedup hash for a job
// ─────────────────────────────────────────────────────────────────────────────
export const computeJobHash = (job: Pick<JobInput, 'title' | 'company' | 'url'>): string => {
  const raw = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}|${job.url.trim()}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
};
