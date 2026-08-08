# Phase 1 & 10: System Architecture

## 1. High-Level Architecture

The AI Career Copilot is a distributed, event-driven web application composed of a modern frontend, a robust backend API, and a worker-based automation layer.

### Tech Stack
- **Frontend:** React + Vite (Fast builds, modern ecosystem)
- **Backend:** Node.js + Express (Scalable async I/O)
- **Database:** MongoDB (Flexible schema for resumes/jobs)
- **Real-time:** Socket.IO (Live dashboard updates)
- **Queue/Workers:** BullMQ + Redis (Job processing, scraping, AI calls)
- **Browser Automation:** Playwright (Job applications, ATS checking)
- **AI Integration:** OpenRouter AI (LLM routing)
- **Notifications:** Telegram API (Instant user alerts)

### Event Flow
1. **Client Action:** User triggers an action (e.g., "Generate Cover Letter").
2. **API Layer:** Express API receives the request, validates it, and pushes a job to BullMQ via Redis.
3. **Queue Processing:** A background worker picks up the job, executing the heavy task (AI generation, Playwright automation).
4. **Real-time Update:** Worker emits progress/completion events via Socket.IO back to the React frontend.
5. **Persistence:** State is updated in MongoDB throughout the lifecycle.

## 2. Dashboard Architecture (Real-time)

The Dashboard provides a command center view of all activities.

### Frontend State Management
- **Global State:** Zustand or Redux Toolkit.
- **Data Fetching:** React Query for caching API responses.
- **Real-time Context:** A dedicated Socket.IO context provider listening to event streams.

### Websocket Events
- `job:found` - When the discovery engine finds a new match.
- `app:status_changed` - When an application moves from "Running" to "Applied" or "Failed".
- `ai:activity_log` - Streaming logs of AI thinking/acting (e.g., "Analyzing JD...", "Drafting Cover Letter...").
- `notification:new` - Incoming alerts.

### Widgets
- **Applications Today / This Week:** Aggregated counts.
- **ATS & Resume Score:** Gauges showing current AI evaluations.
- **Jobs Found & Pending:** Counters for actionable items.
- **Live AI Activity:** A terminal-like scrolling feed of what the AI agents are currently doing.
- **Interview Rate & Graphs:** Recharts/Chart.js visualizers for success metrics over time.

## 3. Folder Structure

```text
carrier-os/
├── client/                 # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-based modules (dashboard, jobs, resumes)
│   │   ├── hooks/          # Custom React hooks (e.g., useSocket)
│   │   ├── store/          # Global state management
│   │   ├── services/       # API clients
│   │   └── App.tsx
│   └── package.json
├── server/                 # Node.js + Express Backend
│   ├── src/
│   │   ├── api/            # Routes and Controllers
│   │   ├── config/         # Environment and DB config
│   │   ├── models/         # Mongoose schemas
│   │   ├── services/       # Core business logic (AI, RAG, Playwright)
│   │   ├── workers/        # BullMQ queue processors
│   │   ├── websockets/     # Socket.IO event handlers
│   │   └── app.ts
│   └── package.json
├── docs/                   # Architecture and Design documents
├── docker-compose.yml      # Local dev environment
└── README.md
```
