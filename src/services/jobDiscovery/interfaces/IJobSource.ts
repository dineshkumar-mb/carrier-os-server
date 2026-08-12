import { CanonicalJob } from '../types';

export interface JobSourceCapabilities {
  api: boolean;
  rss: boolean;
  search: boolean;
  fullDescription: boolean;
  pagination: boolean;
  incrementalSync: boolean;
}

export interface JobDiscoveryContext {
  tenantId: string;
  userId: string;
  keywords?: string[];
  locations?: string[];
  remoteOnly?: boolean;
  experienceMin?: number;
  experienceMax?: number;
  employmentTypes?: string[];
  limit?: number;
  signal?: AbortSignal;
}

export interface JobSourceHealth {
  healthy: boolean;
  latencyMs?: number;
  lastSuccessfulSync?: Date;
  error?: string;
  statusText?: string;
}

export interface IJobSource {
  id: string;
  name: string;
  capabilities: JobSourceCapabilities;

  discover(context: JobDiscoveryContext): Promise<CanonicalJob[]>;
  search?(criteria: JobDiscoveryContext): Promise<CanonicalJob[]>;
  getJob?(id: string): Promise<CanonicalJob | null>;
  healthCheck(): Promise<JobSourceHealth>;
}
