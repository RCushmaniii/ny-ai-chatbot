# RAG Client Playbook (Reusable Standard)

This document is the **client-ready standard** for shipping a Retrieval-Augmented Generation (RAG) chatbot reliably.

It is written to minimize per-client “mystery debugging” by standardizing:

- Retrieval quality (chunking + hybrid retrieval + reranking)
- Grounded answering (citations + abstention behavior)
- Evaluation (golden set + retrieval metrics + hallucination tests)
- Monitoring and cost controls
- Operational debugging (what endpoints/logs prove content vs retrieval issues)

---

## 1) Chunking Strategy (Structure-aware beats naive fixed-size)

### Goals

- Preserve semantic units (sections, bullets, headings)
- Keep chunks small enough for precision, large enough for context
- Avoid splitting critical facts (prices, dates, rules) across chunk boundaries

### Recommended default

- **Prefer structure-aware chunking**:
  - Split by headings / paragraphs / bullets when possible
  - Keep bullet lists together
- **Chunk size**: ~800–1500 characters (or ~150–300 tokens), tuned per content type
- **Overlap**: 50–150 characters (or ~20–50 tokens)

### What we learned here

- PDFs and DOCX often contain critical business facts (dates, pricing, hours). These should land in the **same chunk** as the surrounding context that explains them.
- “It’s in the PDF” is not enough—**it must be chunked so retrieval can find it**.

### Anti-patterns

- Naive fixed-size splitting without respecting paragraphs/bullets
- Chunks with too much boilerplate and not enough unique signal
- Extremely large chunks (low precision) or extremely small chunks (loss of context)

---

## 2) Hybrid Retrieval (Vector + keyword) and optional reranking

### Why hybrid retrieval is required

Vector similarity alone is great for semantic matches, but fails on:

- Short / fuzzy queries (e.g., “teacher ad schedule”)
- Proper nouns, codes, SKUs, pricing formats
- Queries that are “concept adjacent” but not semantically close

### Recommended default pipeline

- **Stage A: Vector search** (pgvector)
  - Search top-K (e.g., 10–25)
  - Apply a threshold (tunable; start permissive in dev)
- **Stage B: Keyword fallback** (ILIKE / full-text)
  - Tokenize query into meaningful terms
  - Search the manual/doc tables for those terms
- **Stage C (optional): Reranking**
  - Use a reranker (or LLM scoring) on top candidates to pick the best 3–5

### What we learned here

- Manual/document KB retrieval was initially failing because it was gated too strictly (`> 0.5`).
- Top-K without an overly strict SQL threshold + keyword fallback is a strong, simple baseline.

### Suggested config defaults (dev vs prod)

- **Development / testing**:
  - Higher recall
  - Lower threshold
  - Higher top-K
- **Production**:
  - Tune thresholds per-client with evaluation metrics
  - Consider reranking for accuracy without exploding context size

---

## 3) Grounded Answering (cite sources, abstain when retrieval is weak)

### Principles

- If retrieval is strong: answer using retrieved facts and **cite sources**.
- If retrieval is weak or empty: **abstain** and ask clarifying questions instead of guessing.
- Always separate:
  - What is known from sources
  - What is general knowledge / suggestion

### Recommended behavior contract

- **Always cite**:
  - URL(s)
  - Source type (website/manual/pdf/docx)
- **Abstain** when:
  - 0 retrieval results
  - All results below threshold
  - The user asks for client-specific facts not in KB (e.g., ad schedules not documented)

### What we learned here

- “It didn’t answer” often means the model had no grounded context.
- Fixing retrieval improves answers immediately.

---

## 4) Evaluation Harness (Golden Q/A + retrieval metrics + hallucination tests)

### Why you need this

Without evaluation, you will:

- Overfit to a few manual tests
- Miss regressions when changing chunking/retrieval thresholds
- Ship a bot that behaves inconsistently

### Minimum viable evaluation

- **Golden question set** (10–50 per client)
  - Must include:
    - Pricing
    - Hours
    - Policies
    - High-value differentiators
    - “Tricky” fuzzy queries clients actually ask
- **Retrieval metrics**
  - Hit rate: % questions with at least 1 retrieved chunk
  - Precision proxy: average similarity of top chunk
  - Coverage: do all critical pages/docs show up as sources?
- **Hallucination tests**
  - Ask for facts that are NOT in KB
  - Ensure bot abstains rather than inventing

### Suggested “golden set” template

For each question:

- **Question**:
- **Expected source**: (URL / doc name)
- **Must-include facts**:
- **Must-not-include**:
- **Pass criteria**:

---

## 5) Monitoring & Cost Controls (cache, rate limits, query classification)

### Monitoring you want by default

- Queries per day
- Retrieval hit ratio
- Top sources
- “Missing knowledge” questions (0-hit)
- Token usage and approximate cost

### Cost controls

- Rate limits (per session/per day)
- Embedding cache (short TTL) for repeated queries
- Query classification (optional)
  - If the query is clearly not business-related, skip retrieval
  - If it’s a pure “general English” request, do not run RAG

### What we learned here

- Simple in-memory caching can prevent embedding rate-limit pain during testing.
- Logging “knowledge events” is extremely useful for debugging and insights.

---

## 6) Operational Debugging (the difference between “content issue” and “retrieval issue”)

### The two failure modes that look identical to users

- **Content is missing** (it truly isn’t in the KB)
- **Content is present but not retrieved** (thresholds/chunking/query mismatch)

### Minimal admin-only tooling you should ship

- **Stats endpoint**: counts and embedding health
  - Example (this repo): `GET /api/admin/knowledge/stats`
- **Substring search endpoint** (proves the text is stored)
  - Example (this repo): `GET /api/admin/knowledge?q=...`

### Debug checklist (fast)

- **Step 1: Verify ingestion**
  - Document count increases
  - Embeddings are non-null
- **Step 2: Prove content exists**
  - Search a unique phrase via substring search
- **Step 3: Verify retrieval**
  - Log top manual candidates (similarities)
  - Ensure keyword fallback triggers for fuzzy queries
- **Step 4: Verify grounding**
  - Confirm the answer cites the doc/page that contains the fact

---

## 7) Data & schema requirements (pgvector + metadata)

### Required invariants

- Embedding model and dimensions must match the DB vector dimension
- All knowledge rows should include:
  - content
  - embedding
  - metadata JSON (parseable)
  - createdAt

### What we learned here

- “source_type: unknown” can happen when metadata isn’t parseable JSON or is missing keys.
- Retrieval should be resilient to bad metadata (never crash retrieval because of metadata parsing).

---

## 8) Security & access control (admin-only ingestion)

### Required controls

- Admin-only access for:
  - Upload routes (PDF/DOCX)
  - Manual knowledge write/delete
  - Analytics/insights endpoints

### What we learned here

- You must enforce admin gating consistently across routes.
- Provide friendly JSON errors (401/403) so the admin UI doesn’t crash.

---

## 9) Web/SSR pitfalls that can derail confidence (hydration issues)

### Why this matters

A bot can be “working,” but the app feels broken if the UI throws hydration errors.

### What we learned here

- **Never use non-deterministic values during render** in SSR components.
  - Example: `Math.random()` in a skeleton component causes hydration mismatch.
- Browser extensions (e.g., Grammarly) can inject DOM and worsen mismatches.
  - Add standard `data-gramm*="false"` attributes to critical inputs.

---

## 10) What you listed vs what we added (completeness check)

### Your list (covered)

- Chunking strategy (structure-aware)
- Hybrid retrieval (vector + keyword) + reranking
- Grounded answering (cite sources, abstain)
- Evaluation harness (golden set + metrics + hallucination tests)
- Monitoring & cost controls (cache, rate limits, query classification)

### Additional items we must include to make this reusable

- Admin-only ingestion + consistent auth gating
- Ingestion validation tooling (stats + substring search)
- Schema invariants (pgvector dimensions, metadata JSON)
- Debug logs for retrieval (top candidates + fallback terms)
- SSR/hydration hardening (no `Math.random()` / `Date.now()` during render)

---

## 11) Bottom line: can this be a “shining example” for other client bots?

Yes—**if you treat this as a reusable product baseline**:

- Standard ingestion + validation endpoints
- Standard retrieval pipeline (hybrid, tunable)
- Standard grounded-answering contract
- Standard evaluation harness
- Standard monitoring and cost controls

What happened here is normal for a first hardening pass. Once these standards are baked in, subsequent clients should require:

- Content ingestion
- A golden Q/A set
- A quick threshold/UX tune

Not a multi-hour debugging session.
