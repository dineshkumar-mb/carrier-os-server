import crypto from 'crypto';
import { CanonicalJob } from './CanonicalJob';

export const computeJobFingerprint = (job: Partial<CanonicalJob>): string => {
  const provider = job.source?.provider?.toLowerCase() || 'unknown';
  const externalId = job.source?.externalId?.trim();

  if (externalId) {
    return crypto.createHash('sha256').update(`${provider}:${externalId}`).digest('hex');
  }

  const company = job.company?.normalizedName || job.company?.name?.toLowerCase().trim() || 'unknown';
  const title = job.normalizedTitle || job.title?.toLowerCase().trim() || 'unknown';
  const location = job.location?.city?.toLowerCase().trim() || (job.location?.remote ? 'remote' : 'global');

  const rawKey = `${provider}:${company}:${title}:${location}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
};
