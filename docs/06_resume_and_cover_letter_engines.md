# Phase 8 & 9: Resume and Cover Letter Engines

## 1. AI Resume Engine

### Core Principles
- **No Hallucinations:** The prompt strictly enforces that no new skills, dates, or experiences can be invented.
- **ATS Optimization:** Exact keyword matching from the JD Analysis.
- **Prioritization:** Reordering projects and experience bullet points so the most relevant items appear first.
- **Bullet Rewriting:** Enhancing action verbs and quantifying results without changing the underlying truth.

### Workflow
1. Fetch User Master Resume + JD Analysis JSON.
2. Filter/reorder Master Resume to create a tailored subset.
3. Rewrite bullet points specifically emphasizing the JD requirements.
4. Pass through Evaluator Agent.
5. Save as a new `Resume Version` in MongoDB.

### Export Pipeline
- **Markdown / HTML:** Native storage formats.
- **PDF:** Generated via Playwright (rendering the HTML view and printing to PDF to ensure pixel-perfect CSS styling).
- **DOCX:** Using `docx` or `html-to-docx` libraries for ATS systems that struggle with PDFs.

## 2. Cover Letter AI

### Inputs
- Job Description Text
- Tailored Resume Version
- Company Context (from Companies DB)
- Role Title

### Generation Strategy
- **Tone:** Professional, enthusiastic, yet human-sounding (avoiding cliché LLM words like "delve", "tapestry", "moreover").
- **Structure:**
  1. Strong opening hooked to the company mission.
  2. Core value proposition (matching the top 2 JD requirements with 2 resume achievements).
  3. Call to action.
- **Constraint:** Strictly no hallucinations. If a requirement is missing, do not mention it.

### Validation
- Output is generated in Markdown.
- Evaluated for readability (Flesch-Kincaid) and tone.
- Presented to the user in a side-by-side editor for final manual tweaks before application.
