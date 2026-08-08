# Phase 4, 7, 14, 15: AI Architecture, RAG, and Memory

## 1. Multi-Agent System Architecture

The AI layer relies on a fleet of specialized agents orchestrated via OpenRouter (utilizing models like GPT-4o, Claude 3.5 Sonnet).

### Agent Definitions
- **Job Discovery Agent:** Filters scraped jobs. Output: Priority score.
- **JD Analysis Agent:** Extracts requirements. Output: JSON schema.
- **Resume Agent:** Tailors resumes. Output: Markdown/HTML.
- **Cover Letter Agent:** Drafts letters. Output: Markdown.
- **ATS / Evaluator Agent:** Scores artifacts. Output: JSON (Score, grammar, readability).
- **Application Agent:** Maps form fields for Playwright. Output: JSON mappings.
- **Interview Coach:** Interactive chatbot for mock interviews.
- **Career Coach:** Analyzes long-term goals.
- **Analytics Agent:** Extracts insights from database metrics.

### Communication Flow
Agents operate in a Directed Acyclic Graph (DAG) flow:
1. `Crawler` -> `JD Analysis Agent`
2. `JD Analysis Agent` + `RAG (Master Resume)` -> `Resume Agent`
3. `Resume Agent` -> `Evaluator Agent` (Retry logic if ATS score < 85)
4. `Evaluator Agent` -> `Cover Letter Agent`

## 2. RAG (Retrieval-Augmented Generation) Pipeline

### Knowledge Base
Documents: Master Resume, Projects, Skills, Experience, Certificates, Achievements, Interview Feedback.

### Architecture
- **Embedding Model:** `text-embedding-3-small` or `nomic-embed-text`.
- **Vector Store:** Pinecone or MongoDB Atlas Vector Search.
- **Chunking Strategy:** Semantic chunking (e.g., one project per chunk, one role per chunk).
- **Retrieval:** Hybrid search (Keyword + Dense Vector).
- **Ranking:** Cross-encoder re-ranking for top-K results to ensure high relevance before passing to LLMs.
- **Caching:** Redis cache for frequent semantic queries.

## 3. Long-Term Memory (Phase 14)

### Semantic Storage
- All historical applications, feedback, and learning progress are embedded and stored in the Vector Store.
- Before answering a question or generating a new resume, the agent performs a semantic search over past `Application Logs` and `Recruiter Feedback` to avoid past mistakes.

## 4. Evaluator Agent (Phase 15)

### Goal
Provide a strict, objective assessment of the generated resume and cover letter against the JD.

### JSON Response Schema
```json
{
  "atsScore": 88,
  "grammarScore": 95,
  "readability": "High",
  "recruiterScore": 80,
  "keywordMatch": ["React", "TypeScript"],
  "missingKeywords": ["GraphQL", "Docker"],
  "improvementSuggestions": [
    "Highlight Docker experience in the 2022 project.",
    "Quantify the performance impact in bullet 2."
  ]
}
```
### Retry Logic
If `atsScore` < 80, the orchestrator triggers the `Resume Agent` again, passing the `improvementSuggestions` as corrective feedback (up to 3 retries).
