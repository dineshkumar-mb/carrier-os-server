export interface CanonicalJob {
  fingerprint: string;

  source: {
    provider: string;
    externalId?: string;
    originalUrl: string;
    discoveredAt: Date;
  };

  company: {
    name: string;
    normalizedName: string;
    domain?: string;
  };

  title: string;
  normalizedTitle: string;

  description: string;

  location?: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };

  employmentType?: string;

  experience?: {
    minYears?: number;
    maxYears?: number;
  };

  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };

  skills?: string[];

  postedAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;

  metadata?: Record<string, unknown>;
}
