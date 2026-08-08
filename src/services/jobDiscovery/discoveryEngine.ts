import { CareerProfile } from '../../models/CareerProfile';
import { Resume } from '../../models/Resume';
import { Configuration } from '../../models/Configuration';
import { Job } from '../../models/Job';
import { JobMatch } from '../../models/JobMatch';
import { providers } from './providers';
import { generateSearchQueries } from './queryGeneratorAgent';
import { filterDuplicates } from './deduplicator';
import { matchJobToProfile } from '../ai/jobMatcherAgent';
import { emitLiveActivity } from '../../config/socket';
import { JobInput, ProviderCircuitState, DiscoveryFilter } from './types';

// ─── Circuit Breaker & Concurrency Tuning for High-Speed Discovery ───────────
const circuitState = new Map<string, ProviderCircuitState>();
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 5 * 60 * 1000; // 5 minutes
const PROVIDER_TIMEOUT_MS = 4000; // 4 seconds max per provider (Fast Discovery)
const MAX_CONCURRENT_AI_CALLS = 8;
const MAX_JOBS_PER_RUN = 12;

const getCircuit = (name: string): ProviderCircuitState => {
  if (!circuitState.has(name)) {
    circuitState.set(name, { failures: 0, openedAt: null, isOpen: false });
  }
  return circuitState.get(name)!;
};

const isCircuitOpen = (name: string): boolean => {
  const state = getCircuit(name);
  if (!state.isOpen) return false;
  if (state.openedAt && Date.now() - state.openedAt > CIRCUIT_RESET_MS) {
    state.isOpen = false;
    state.failures = 0;
    state.openedAt = null;
    return false;
  }
  return true;
};

const recordProviderSuccess = (name: string) => {
  const state = getCircuit(name);
  state.failures = 0;
};

const recordProviderFailure = (name: string) => {
  const state = getCircuit(name);
  state.failures++;
  if (state.failures >= CIRCUIT_FAILURE_THRESHOLD && !state.isOpen) {
    state.isOpen = true;
    state.openedAt = Date.now();
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
  );
  return Promise.race([promise, timeout]);
};

class Semaphore {
  private queue: (() => void)[] = [];
  private count: number;
  constructor(limit: number) { this.count = limit; }

  async acquire(): Promise<void> {
    if (this.count > 0) { this.count--; return; }
    await new Promise<void>(resolve => this.queue.push(resolve));
  }

  release() {
    this.count++;
    const next = this.queue.shift();
    if (next) { this.count--; next(); }
  }
}

export const runJobDiscovery = async (userId: string): Promise<any[]> => {
  const sem = new Semaphore(MAX_CONCURRENT_AI_CALLS);

  try {
    await emitLiveActivity(`[Discovery] ⚡ High-Speed AI job scan initiated...`);

    let profile: any = await CareerProfile.findOne({ userId });
    
    if (!profile) {
      const resume = await Resume.findOne({ userId });
      if (!resume) {
        await emitLiveActivity(`[Discovery] ❌ Resume and Profile not found. Please upload resume first.`);
        return [];
      }
      
      const exp = Array.isArray(resume.experience) ? resume.experience : [];
      const latestRole = exp.length > 0 ? (exp[0] as any).role || 'Software Engineer' : 'Software Engineer';
      
      profile = {
        primaryRole: latestRole,
        skills: resume.skills || [],
        seniority: latestRole.toLowerCase().includes('senior') ? 'Senior' : 'Mid-level',
        remotePreference: 'Remote',
        memoryContext: 'Derived from resume.'
      };
    }

    const config = await Configuration.findOne({ userId }).lean();
    const filter: DiscoveryFilter = {
      remoteStatus: config?.remoteOnly ? ['Remote'] : undefined,
      countries: config?.preferredCountries?.length ? config.preferredCountries : undefined,
    };

    // 1. Generate search queries (capped to top 2 for speed)
    let queries: string[] = [];
    try {
      queries = await generateSearchQueries(profile);
    } catch (_err) {
      queries = [profile.primaryRole || 'Software Engineer'];
    }
    const activeQueries = queries.slice(0, 2);

    // 2. Parallel provider search with 4s fast timeout
    let rawJobs: JobInput[] = [];

    const searchPromises = activeQueries.map(async (query) => {
      const providerPromises = providers.map(async (provider) => {
        if (isCircuitOpen(provider.name)) return [];

        try {
          const results = await withTimeout(
            provider.searchJobs(profile, query, filter),
            PROVIDER_TIMEOUT_MS,
            `${provider.name}/${query}`
          );
          recordProviderSuccess(provider.name);
          return results;
        } catch (_err) {
          recordProviderFailure(provider.name);
          return [];
        }
      });

      const results = await Promise.allSettled(providerPromises);
      return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    });

    const allResults = await Promise.all(searchPromises);
    rawJobs = allResults.flat();

    // 3. Deduplication
    const uniqueJobs = await filterDuplicates(rawJobs);
    const jobsToProcess = uniqueJobs.slice(0, MAX_JOBS_PER_RUN);

    // 4. Parallel AI Matching (Process newly fetched + existing unmatched jobs)
    await Promise.all(
      jobsToProcess.map(async (uj) => {
        let jobDoc: any = await Job.findOne({ url: uj.url });

        if (jobDoc) {
          const matchExists = await JobMatch.exists({ userId, jobId: jobDoc._id });
          if (matchExists) return; // Already scored for this user
        }

        await sem.acquire();
        try {
          const matchDetails = await matchJobToProfile(uj, profile);

          if (!jobDoc) {
            jobDoc = await Job.create({
              title: uj.title,
              company: uj.company,
              description: matchDetails.normalizedDescription || uj.description,
              location: uj.location,
              country: uj.country,
              city: uj.city,
              url: uj.url,
              applicationUrl: uj.applicationUrl || uj.url,
              companyLogo: uj.companyLogo,
              salary: uj.salaryMin
                ? { min: uj.salaryMin, max: uj.salaryMax, currency: uj.salaryCurrency }
                : undefined,
              skills: matchDetails.requiredSkills.length ? matchDetails.requiredSkills : (uj.skills || []),
              source: uj.source || 'Aggregator',
              status: 'active',
              postedDate: uj.postedDate || new Date()
            });
          }

          await JobMatch.create({
            userId,
            jobId: jobDoc._id,
            matchScore: matchDetails.matchScore,
            matchReasons: matchDetails.matchReasons,
            missingSkills: matchDetails.missingSkills,
            recommendedSkills: matchDetails.recommendedSkills,
            confidenceScore: matchDetails.confidenceScore,
            salaryFit: matchDetails.salaryFit,
            locationFit: matchDetails.locationFit,
            experienceFit: matchDetails.experienceFit,
            applicationPriority: matchDetails.applicationPriority,
            state: 'Discovered',
            decision: (matchDetails as any).decision || 'REVIEW'
          });
        } catch (err) {
          console.error(`[Discovery] Failed processing job "${uj.title}":`, err);
        } finally {
          sem.release();
        }
      })
    );

    await emitLiveActivity(`[Discovery] 🎉 Job discovery complete.`);

    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 });
    return jobs;
  } catch (error) {
    console.error('[Discovery] Engine Error:', error);
    return [];
  }
};
