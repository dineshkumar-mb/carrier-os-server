# Phase 5 & 6: Job Discovery & JD Intelligence

## 1. Job Discovery Engine

### Architecture
A distributed crawling system utilizing BullMQ and Playwright/Cheerio.

### Sources
- **ATS Boards:** Greenhouse, Lever, Ashby (via direct API endpoints where possible, scraping fallback).
- **Aggregators:** Wellfound, Naukri.
- **Direct:** Specific company career pages.

### Crawler Flow
1. **Scheduling:** Cron jobs push tasks to BullMQ (e.g., `scrape:greenhouse`).
2. **Rate Limiting:** Redis-backed rate limiters per domain to avoid IP bans.
3. **Execution:** Playwright worker navigates, extracts raw text/HTML.
4. **Duplicate Detection:** SHA-256 hash of `company + title + description`.
5. **Database Flow:** Insert raw job into MongoDB; push `analyze:job` to queue.

### Job Matching Pipeline
Jobs are run through a rapid filtering model (cheaper LLM or traditional NLP) to check against the user's base criteria (e.g., Visa sponsorship, Remote, Minimum Salary) before deep analysis.

## 2. JD Intelligence Pipeline

### Extraction
The `JD Analysis Agent` processes the raw description and outputs strict JSON.

#### Schema
```json
{
  "skills": {
    "required": ["Node.js", "MongoDB"],
    "niceToHave": ["AWS", "Kubernetes"]
  },
  "experience": {
    "yearsMin": 3,
    "yearsMax": 5
  },
  "responsibilities": ["Design APIs", "Mentor juniors"],
  "salary": { "min": 100000, "max": 150000, "currency": "USD" },
  "location": { "type": "Hybrid", "city": "New York" },
  "benefits": ["Health", "401k"],
  "techStack": ["React", "Node", "MongoDB"],
  "softSkills": ["Communication", "Leadership"]
}
```

### Generation & Insights
Once extracted, a secondary prompt generates user-facing insights:
- **ATS Keywords:** Exact phrasing needed for the resume.
- **Missing Skills:** Delta between User Profile and JD.
- **Learning Roadmap:** Quick 3-step guide to bridge the skill gap before the interview.
- **Interview Difficulty:** Estimated based on role seniority and tech stack complexity.
- **Application Recommendation:** Score (1-100) on whether the user should apply.
