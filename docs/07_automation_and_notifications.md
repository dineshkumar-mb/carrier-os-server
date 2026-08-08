# Phase 11, 12, 13: Automation, Notifications, and Analytics

## 1. Browser Automation Layer (Phase 11)

### Architecture
Powered by Playwright running in background BullMQ workers.

### Approval Workflow (Human-in-the-Loop)
1. **Drafting:** Application is prepared (Form fields mapped, Resume tailored).
2. **Approval:** State set to `Pending Approval`. User clicks "Approve" on the dashboard.
3. **Execution:** Playwright job is dispatched.

### Automation Flow
- **Field Mapping:** Uses LLMs to map the application form inputs (e.g., standardizing "First Name", "Given Name", "FN").
- **Uploads:** Playwright handles file input elements for Resume (PDF) and Cover Letter (PDF).
- **Screenshots:** Takes a screenshot of the final form before submission, saved to GCS/S3.
- **Retries:** Exponential backoff for network timeouts.
- **Security Constraint:** The system will *not* generate dynamic selectors for protected platforms (e.g., CAPTCHA-heavy ATS or LinkedIn). It targets generic ATS forms (Greenhouse/Lever) via stable DOM selectors or API where possible.

## 2. Notification Service (Phase 12)

### Channels
- **Telegram:** Primary instant alert (Bots).
- **Email:** Daily summaries (SendGrid/Resend).
- **Browser:** Web Push API for active sessions.

### Architecture
- **Queue:** Dedicated `notifications` queue in BullMQ.
- **Templates:** Handlebars/Mustache templates for consistent messaging.
- **Preferences:** User schema stores boolean flags for each channel.
- **Retry & Logging:** Failed deliveries (e.g., Telegram API down) are retried 3 times and logged.

## 3. Analytics Engine (Phase 13)

### Metrics Calculated
- Application success rate (Applied vs Interview vs Reject).
- Interview rate (Time-series data).
- Best performing resume version (A/B testing via ATS scores and actual callback rates).
- Most requested skills (Aggregated across saved/applied jobs).
- Skill gaps (User's missing skills frequency).
- Average salary analysis (Box plots based on location/role).

### Dashboards
- Served via Express API as aggregated JSON payloads.
- Visualized in React using Recharts (Line charts for timelines, Radar charts for skill gaps, Bar charts for salaries).
