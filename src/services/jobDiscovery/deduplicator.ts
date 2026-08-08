import { aiProvider } from '../ai/aiClient';
import { Job } from '../../models/Job';
import { JobInput, computeJobHash } from './types';

const dotProduct = (a: number[], b: number[]): number => {
  let product = 0;
  for (let i = 0; i < a.length; i++) product += a[i] * b[i];
  return product;
};

const magnitude = (a: number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * a[i];
  return Math.sqrt(sum);
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
};

export const filterDuplicates = async (jobs: JobInput[]): Promise<JobInput[]> => {
  console.log(`[Deduplicator] Processing ${jobs.length} jobs for deduplication...`);

  // ── Stage 0: Load already-stored URLs + hashes from MongoDB ────────────────
  const existingUrls = new Set<string>();
  const existingHashes = new Set<string>();
  try {
    const existingJobs = await Job.find({ status: 'active' }, { url: 1, sha256Hash: 1 }).lean();
    for (const ej of existingJobs) {
      if (ej.url) existingUrls.add(ej.url.trim());
      if (ej.sha256Hash) existingHashes.add(ej.sha256Hash);
    }
  } catch (err) {
    console.warn('[Deduplicator] Could not load existing job hashes from DB:', err);
  }

  const uniqueJobs: JobInput[] = [];
  const seenUrls = new Set<string>();
  const seenHashes = new Set<string>();
  const jobEmbeddings: { job: JobInput; vector: number[] }[] = [];

  for (const job of jobs) {
    if (!job.url) continue;

    // ── Stage 1: Exact URL dedup (O(1)) ────────────────────────────────────
    const normalizedUrl = job.url.trim();
    if (seenUrls.has(normalizedUrl) || existingUrls.has(normalizedUrl)) continue;
    seenUrls.add(normalizedUrl);

    // ── Stage 2: SHA-256 hash dedup (O(1)) — fast, before any AI call ──────
    const hash = computeJobHash({ title: job.title, company: job.company, url: job.url });
    (job as any).sha256Hash = hash; // attach for storage
    if (seenHashes.has(hash) || existingHashes.has(hash)) {
      console.log(`[Deduplicator] SHA dedup hit: "${job.title}" at "${job.company}"`);
      continue;
    }
    seenHashes.add(hash);

    // ── Stage 3: Exact title + company match ────────────────────────────────
    const exactDup = uniqueJobs.some(
      uj =>
        uj.title.toLowerCase() === job.title.toLowerCase() &&
        uj.company.toLowerCase() === job.company.toLowerCase()
    );
    if (exactDup) continue;

    // ── Stage 4: Semantic embedding similarity (only for remaining candidates)
    try {
      const payload = `${job.title} at ${job.company} (${job.location})`;
      const vector = await aiProvider.embeddings(payload);

      let isSemanticDup = false;
      for (const item of jobEmbeddings) {
        const similarity = cosineSimilarity(vector, item.vector);
        if (similarity > 0.88) {
          console.log(
            `[Deduplicator] Semantic dup: "${payload}" ~ "${item.job.title} at ${item.job.company}" (${similarity.toFixed(2)})`
          );
          isSemanticDup = true;
          break;
        }
      }

      if (!isSemanticDup) {
        uniqueJobs.push(job);
        jobEmbeddings.push({ job, vector });
      }
    } catch (err) {
      // Embedding failure is non-fatal — include the job
      console.warn('[Deduplicator] Embedding error, including job without semantic check:', (err as Error).message);
      uniqueJobs.push(job);
    }
  }

  console.log(
    `[Deduplicator] Done. ${jobs.length} raw → ${uniqueJobs.length} unique ` +
    `(${jobs.length - uniqueJobs.length} duplicates removed)`
  );
  return uniqueJobs;
};
