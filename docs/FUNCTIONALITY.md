# Carrier OS — Autonomous AI Career Workflow Platform
### System Architecture, Subsystems & Technical Functionality Guide

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Runtime Architecture](#2-runtime-architecture)
3. [Workflow Engine](#3-workflow-engine)
4. [Agent Platform](#4-agent-platform)
5. [Tool Registry](#5-tool-registry)
6. [Memory System](#6-memory-system)
7. [Policy Engine](#7-policy-engine)
8. [Quality Gates](#8-quality-gates)
9. [Trigger System](#9-trigger-system)
10. [Job Discovery](#10-job-discovery)
11. [Document Generation](#11-document-generation)
12. [Browser Automation](#12-browser-automation)
13. [Dashboard](#13-dashboard)
14. [Database](#14-database)
15. [Deployment](#15-deployment)
16. [Security](#16-security)
17. [Observability](#17-observability)
18. [Testing](#18-testing)
19. [API Reference](#19-api-reference)
20. [Extension Guide](#20-extension-guide)

---

## 1. System Overview

**Carrier OS** has evolved from an AI-assisted job searching tool into a fully autonomous, modular workflow-driven **AI Career Platform**. The system proactively discovers live job opportunities, matches candidates using multi-agent AI scoring, tailors ATS-optimized resume artifacts, generates personalized cover letters, evaluates risk via quality gates, and executes web applications via headless browser automation.

Current engineering efforts focus on hardening reliability, security, observability, and measuring real-world outcomes (interview and offer conversion rates) rather than adding new infrastructure, as the core platform abstractions are already mature.

---

## 2. Runtime Architecture

The **Agent Runtime** acts as the central execution harness for autonomous workflows. It moves beyond simple sequential orchestration to support full lifecycle management.

```
Workflow
↓
Scheduler
↓
Runtime
↓
Agent Plugins
```

### Scheduler & Execution
The Scheduler manages the actual execution of workflow definitions, handling:
- DAG execution (Directed Acyclic Graph)
- Parallel execution
- Retry logic
- Resumability
- State transitions

### State Machine
Every execution follows a strict deterministic state machine:
```
CREATED
↓
PLANNING
↓
READY
↓
RUNNING
↓
WAITING
↓
RETRYING
↓
FAILED
↓
COMPLETED
↓
CANCELLED
```

---

## 3. Workflow Engine

The platform execution model is built around a declarative **Workflow Registry**. Execution is no longer just sequential scripting; it is modular and feature-rich.

### Workflow Registry
Core workflows include:
- `ApplyToJobWorkflow`
- `ResumeAuditWorkflow`
- `InterviewPrepWorkflow`
- Future custom workflows

### Workflow Versioning
To make historical executions reproducible, every execution tracks:
- Workflow version
- Workflow hash
- Runtime version

---

## 4. Agent Platform

The Agent Platform manages multi-LLM routing, prompt injection defense, structured parsing, and specialized agent personas (Job Matcher, Resume Tailor, Form Solver, Interview Simulator, etc.). It leverages an OpenRouter fallback system to ensure high availability across tier-free and premium AI models.

---

## 5. Tool Registry

Agents interact with external environments via standardized, sandboxed **Tools** managed by a unified Tool Registry. 

```
Agent
↓
Tool Registry
↓
Browser
↓
Database
↓
Search
↓
Email
```

---

## 6. Memory System

Carrier OS implements a robust, tiered memory architecture, properly separating transient working context from long-term factual knowledge.

### Tiered Memory
- **Working Memory**: In-flight state of the active workflow step.
- **Session Memory**: User's active session state.
- **Episodic Memory**: Historical record of past executions and user interactions.
- **Semantic Memory**: Persistent candidate knowledge graph (core competencies, experience).

### Knowledge Layer
Factual knowledge is isolated from user memory, providing a shared reference base for agents:
- ATS best practices
- Company research
- Interview questions
- Salary benchmarks
- Skill taxonomy

---

## 7. Policy Engine

The deterministic **Policy Engine** enforces candidate-defined governance and safety constraints prior to executing AI decisions.

### Core Capabilities:
- **Manual mode**: Requires full user review.
- **Assisted mode**: AI drafts materials, user confirms submission.
- **Automatic mode**: AI executes end-to-end for high-confidence matches.
- **Rule evaluation**: Enforces salary, location, and role constraints.
- **Approval routing**: Determines if human intervention is required.

---

## 8. Quality Gates

Before any job application is submitted, it must pass through sequential **Quality Gates** to ensure safety and quality:

```
Duplicate Gate
↓
Resume Gate
↓
Risk Gate
↓
Policy
```

---

## 9. Trigger System

Workflows are initiated reactively through the event-driven **Trigger System**. Workflows begin via specific document or system triggers:

- `ResumeUploaded`
- `JobsDiscovered`
- `EmailReceived`
- `DailyScan`

---

## 10. Job Discovery

The multi-provider aggregation engine (Greenhouse, Remotive, Himalayas, Lever, etc.) handles deduplication, circuit breaking, and automatic re-scoring of existing job listings.

---

## 11. Document Generation

Tailored resumes and cover letters are stored as **immutable, versioned artifacts**, generating PDF and DOCX formats.

### Artifact Management
Every tailoring operation creates a new, immutable version linked to the specific job application:
```
Master Resume
↓
Resume v12
↓
Resume v13
↓
Resume v14
```

---

## 12. Browser Automation

The asynchronous worker queue (BullMQ + Redis) manages isolated headless Playwright browser contexts. It uses AI form-solving agents to automatically fill dynamic application fields, handle redirects, and attach PDF resumes.

---

## 13. Dashboard

The frontend React command center provides deep visibility into the workflow platform.

### Core Metrics & Views:
- Career Health
- Workflow Status
- Runtime Activity
- Agent Activity
- Pipeline Funnel
- Resume Analytics
- Policy Status
- Timeline
- Execution History

---

## 14. Database

MongoDB (Mongoose) stores the platform's domain models: `User`, `CareerProfile`, `Resume`, `Job`, `JobMatch`, `Application`, `CoverLetter`, `CompanyProfile`, `InboundEmail`, `CalendarEvent`, `Notification`, and `QueueFailureLog`.

---

## 15. Deployment

Carrier OS is structured as a **2-Directory Monorepo**:
- **`client/`**: React 18, Vite, Tailwind, TanStack Query.
- **`server/`**: Node.js, Express, BullMQ, Playwright.

Deployment pipelines target containerized (Docker) environments backed by managed MongoDB and Redis instances.

---

## 16. Security

- **Credential Vault**: Encrypted and isolated storage for OpenRouter keys, LinkedIn credentials (optional), and job board tokens.
- **Audit Logs**: Tracking of all automated submissions and policy approvals.
- **Prompt Defense**: Real-time sanitization of untrusted inputs.

---

## 17. Observability

- **Notification Service**: Workflows publish events rather than sending notifications directly. A dedicated service handles routing to:
  - In-app notifications
  - Email
  - Push notifications
  - Socket events (Live Activity Streaming)
- **Tracing & Dashboards**: Detailed performance tracking of workflow steps.

---

## 18. Testing

A robust **Benchmark Framework** goes beyond standard unit testing to measure real-world AI platform efficacy:

- Resume tailoring quality
- ATS improvement
- Workflow success rate
- Runtime latency
- Cost (LLM token usage)
- Interview conversion (Real-world outcome tracking)

---

## 19. API Reference

REST endpoints are exposed by the Express API covering:
- Authentication & User Management
- Job Discovery & Matching
- Application Lifecycle
- Resume Parsing & Management
- Dashboard Analytics & Health

---

## 20. Extension Guide

The modular architecture is designed for extensibility:
- **Custom Workflows**: Implement the standard workflow interface to register new DAGs.
- **New Agent Tools**: Add new capabilities to the Tool Registry.
- **Custom Quality Gates**: Define new risk or validation rules in the Policy Engine.

---
**Strategic Direction**: Moving forward, the focus is on hardening reliability (failure recovery, retries, resumability), security, observability, end-to-end testing, and measuring real-world outcomes. The core platform abstractions are complete and mature.
