# Phase 2: UI/UX Design

## 1. Design Philosophy

The AI Career Copilot UI is inspired by modern developer and productivity tools like Linear, Notion, GitHub, and Vercel. 
- **Aesthetics:** Minimalist, high contrast, dark mode by default, glassmorphism overlays, subtle micro-animations.
- **Typography:** Inter or Geist for clean, highly legible sans-serif text. Monospace fonts (e.g., JetBrains Mono) for logs and code-like data.
- **Colors:** 
  - Background: Deep slate/black (`#0D0D0D`)
  - Surface: Dark gray (`#1A1A1A`)
  - Primary Accent: Vercel-like vibrant blue (`#0070F3`) or Linear-like purple (`#5E6AD2`)
  - Success/Warning/Error: Standard muted semantic colors.

## 2. Page Hierarchy & UX Flows

### 1. Dashboard (`/`)
- Command center with widgets (Applications, ATS score, Live AI logs).
- Quick actions: "Upload Resume", "Scan Jobs".

### 2. Job Discovery (`/jobs`)
- Kanban board or list view of jobs (New, Saved, Applied, Rejected).
- **UX Flow:** Click a job -> opens a side-panel drawer with Job Details without losing context.

### 3. Job Details (`/jobs/:id`)
- Split view: Job description on the left, AI insights (Missing skills, ATS match) on the right.
- Action button: "Auto-Apply" or "Generate Tailored Resume".

### 4. Resume Builder & History (`/resumes`)
- Notion-style block editor for the Master Resume.
- Version history tree showing which resume was tailored for which job.

### 5. Cover Letters (`/cover-letters`)
- Split view editor. Markdown preview and rich text.

### 6. Application Tracker (`/applications`)
- Pipeline view (Applied -> Interview -> Offer). Playwright logs available for automated apps.

### 7. Interview Preparation (`/interviews`)
- AI chat interface acting as the Interview Coach. Mock sessions and feedback logs.

### 8. Career Analytics (`/analytics`)
- Charts showing success rates, skill demand graphs.

### 9. Settings, Profiles & Notifications
- AI Persona settings, API keys, Telegram link, and global preferences.

## 3. Core Components (Design System)

- **Command Palette (Cmd+K):** Global search for jobs, resumes, and quick actions.
- **Kanban Board:** Drag-and-drop lists for application tracking.
- **Split-Panes:** Resizable split views for comparing JD with Resumes.
- **Live Terminal Window:** A stylized log viewer for Playwright and AI worker tasks.
- **Glassy Modals:** For confirmations and settings.
- **Stat Cards:** Clean, numeric widgets for the dashboard with sparkline charts.
