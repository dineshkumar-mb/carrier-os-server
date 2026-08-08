# Phase 3: Database Design

## 1. Overview

The AI Career Copilot uses MongoDB as its primary datastore. The schema is designed for flexibility (accommodating diverse job descriptions and resumes) while maintaining strict validation for core workflows.

## 2. Collections & Schemas

### `Users`
Stores authentication, API keys, and global preferences.
- **Relations:** 1-to-N with Resumes, Jobs, Applications.
- **Indexes:** `{ email: 1 }` (unique).

### `Jobs`
Normalized job listings scraped from various sources.
- **Fields:** `title`, `company`, `location`, `salary`, `description`, `skills[]`, `url`, `source`.
- **Indexes:** `{ title: "text", description: "text" }`, `{ "skills": 1 }`.

### `Applications`
Tracks the lifecycle of applying to a job.
- **Fields:** `jobId`, `userId`, `resumeVersionId`, `coverLetterId`, `status` (Pending, Auto-Applying, Applied, Interview, Rejected), `timeline[]`.
- **Relations:** References Jobs, Users, Resume Versions.
- **Indexes:** `{ userId: 1, status: 1 }`.

### `Resumes` (Master)
The source of truth for a user's career.
- **Fields:** `userId`, `experience[]`, `education[]`, `skills[]`, `projects[]`.

### `Resume Versions`
Tailored snapshots for specific jobs.
- **Fields:** `masterId`, `jobId`, `content` (Markdown/HTML), `atsScore`, `atsFeedback`.
- **Indexes:** `{ jobId: 1 }`.

### `Cover Letters`
Generated letters.
- **Fields:** `jobId`, `resumeVersionId`, `content`.

### `Notifications`
User alerts.
- **Fields:** `userId`, `message`, `type`, `read`, `channel` (Telegram, In-App).
- **Indexes:** `{ userId: 1, read: 1 }`, TTL index for expiration.

### `Companies`
Aggregated metadata about companies.
- **Fields:** `name`, `domain`, `techStack[]`, `culture`.

### `Activity Logs` & `Automation Logs`
System telemetry and Playwright execution logs.
- **Scalability:** Uses MongoDB Time Series collections or strict TTL indexes to auto-delete after 30 days.
- **Indexes:** `{ jobId: 1, timestamp: -1 }`.

### `ATS Analysis`
AI evaluation outputs for resumes.
- **Fields:** `resumeVersionId`, `jobId`, `keywordMatch`, `missingSkills[]`, `readability`.

### `Interview Sessions`
Mock interview transcripts and feedback.
- **Fields:** `applicationId`, `transcript[]`, `feedback`, `score`.

### `Career Goals`
User's long-term objectives.
- **Fields:** `userId`, `targetRoles[]`, `targetSalary`, `learningRoadmap`.

## 3. Example Document (`Jobs`)

```json
{
  "_id": "ObjectId('...')",
  "title": "Senior Frontend Engineer",
  "company": "Vercel",
  "location": "Remote",
  "salary": { "min": 150000, "max": 180000, "currency": "USD" },
  "description": "We are looking for...",
  "skills": ["React", "TypeScript", "Next.js"],
  "source": "Greenhouse",
  "url": "https://boards.greenhouse.io/vercel/jobs/123",
  "status": "active",
  "createdAt": "2023-10-27T10:00:00Z"
}
```

## 4. Scalability Considerations
- **Read-Heavy vs Write-Heavy:** Job listings will be read-heavy. Automation logs will be write-heavy. Separate these workloads by utilizing Time Series collections for logs.
- **Aggregation:** Use MongoDB aggregation pipelines for the Analytics Engine to compute success rates and skill demands efficiently.
