# Carrier OS — Backend Kernel & 17-Agent OS Engine

> **Carrier OS Backend** is an open-source, multi-tenant autonomous career engine powered by a 17-agent runtime kernel, deterministic quality gates, and automated Playwright web execution.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Playwright](https://img.shields.io/badge/Playwright-1.61-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

---

## 🛡️ Core 6 Architectural & Security Invariants

The backend engine enforces **6 Frozen Invariants** to guarantee multi-tenant security and deterministic execution:

1. **Immutable TenantContext**: `readonly tenantId` & `readonly userId` established exclusively by Auth Middleware (JWT/session). Identity overrides in client request bodies are rejected.
2. **Client Identity Non-Authorization**: Request body or URL parameter identity is NEVER treated as authorization.
3. **Tenant-Scoped Repositories**: All persistence passes through `BaseTenantRepository` applying compound ownership filters (`tenantId` + `userId` + `resourceId`).
4. **Hard LOCAL_ONLY Privacy Boundary**: `LOCAL_ONLY` privacy mode strictly prohibits failover to cloud LLMs (OpenAI/Anthropic). If local Ollama fails, execution halts safely with user notification.
5. **Deterministic Policy Authorization**: AI agents make recommendations; deterministic Quality Gates & Policy Engine authorize execution.
6. **Execution Ownership Traceability**: Every execution, artifact, event, and tool invocation is traceable to exactly one immutable `executionId` and originating `TenantContext`.

---

## 🤖 17-Agent Engine Architecture

Carrier OS orchestrates 17 specialized agents structured across 5 execution layers:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Discovery & Intelligence Layer                           │
│ JobDiscoveryAgent ➔ JobVerificationAgent ➔ CompanyEnrichment│
├─────────────────────────────────────────────────────────────┤
│ 2. Matching & Strategy Layer                                │
│ AIMatchingAgent ➔ CandidateSkillGraph ➔ CareerHealthEngine  │
├─────────────────────────────────────────────────────────────┤
│ 3. Document Tailoring & Gate Layer                          │
│ ATS-Tailored Resume ➔ Human-Like Cover Letter ➔ ATS Analyzer│
├─────────────────────────────────────────────────────────────┤
│ 4. Execution & Automation Layer                             │
│ PolicyEngine ➔ HumanApprovalCenter ➔ Playwright BrowserTool │
├─────────────────────────────────────────────────────────────┤
│ 5. Recruiter Intelligence & Learning Layer                  │
│ EmailIntelligence ➔ CalendarAgent ➔ ReflectionAgent ➔ Learn │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in `/server` based on `.env.example`:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=supersecretjwtkey_12345
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/carrier-os
REDIS_URL=redis://127.0.0.1:6380

# AI Provider Keys
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-proj-...

# Live Gmail API Credentials
GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your_client_secret
GMAIL_REFRESH_TOKEN=1//04...
GMAIL_USER_EMAIL=your_email@gmail.com
```

---

## 🚀 Quick Start & Testing

### Installation

```bash
# Install dependencies
npm install

# Start backend development server (API + BullMQ Worker)
npm run dev
```

### Running Security & E2E Test Suites

```bash
# Run Multi-User E2E Production Test Suite
npx tsx src/tests/test_multi_user_e2e.ts

# Run Multi-Tenant Security & Isolation Test Suite
npx tsx src/tests/test_multi_tenant_security.ts

# Run Log Sanitization & Redaction Test Suite
npx tsx src/tests/test_log_redaction.ts

# Run Authentication & Bcrypt Test Suite
npx tsx src/tests/test_auth_flow.ts
```

---

## 📡 API Endpoints

- `POST /api/auth/register` — Candidate registration with password hashing.
- `POST /api/auth/login` — Authentication & JWT issuance (Rate-limited).
- `POST /api/auth/forgot-password` — Password reset token dispatch.
- `GET /api/jobs` — Enriched discovered jobs with candidate match fit scores.
- `POST /api/jobs/scan` — Trigger AI job discovery engine.
- `GET /api/applications` — 12-state application pipeline logs.
- `POST /api/inbox/scan` — Live Gmail recruiter email scan & correlation.
- `GET /api/approval/queue` — Human Approval Center queue.
- `GET /health/ready` — System readiness & component telemetry.

---

## 📄 License

MIT License © 2026 Carrier OS Team
