# Lessons Learned (RAG, Admin Insights, and SSR Stability)

**Last Updated:** February 11, 2026

This document captures practical lessons learned while validating and troubleshooting the RAG knowledge upload/retrieval system and the Admin Insights dashboard.

---

## 9) Vercel AI Gateway bypass and API key validation

### What went wrong

- The embed chatbot returned "Sorry, I encountered an error" on all messages in production.
- Root cause 1: `OPENAI_API_KEY` was set to placeholder value `sk-your-openai-api-key-here` in Vercel env vars.
- Root cause 2: `@ai-sdk/openai` v2.x routes through Vercel AI Gateway by default when deployed on Vercel, which requires credit card setup even for free-tier usage.
- Root cause 3: The embed chat endpoint (`/api/embed/chat`) had a generic catch-all that returned "Failed to process message" — hiding the actual error from both the user and the admin.

### What we fixed

- **Centralized OpenAI provider** (`lib/ai/openai.ts`): Created a shared provider using `createOpenAI()` with explicit `baseURL: "https://api.openai.com/v1"` to bypass Vercel AI Gateway. Updated all 10 files that imported directly from `@ai-sdk/openai`.
- **Improved embed error handling**: The `/api/embed/chat` endpoint now differentiates between API key issues, 401 rejections, rate limits, timeouts, and gateway errors — surfacing actionable messages instead of a generic 500.
- **Set real API key**: Updated Vercel env vars with a valid, funded OpenAI API key.

### Lessons

- **Never assume env vars are real** — placeholder values like `sk-your-openai-api-key-here` pass existence checks but fail at runtime. Validate key format, not just presence.
- **AI SDK v2 breaking change**: `@ai-sdk/openai` v2.x silently routes through Vercel AI Gateway. If you don't want gateway dependency, explicitly set `baseURL` to `https://api.openai.com/v1`.
- **Generic error handlers hide root causes** — every API endpoint should surface categorized error messages, especially in embed/widget contexts where there's no admin console to check.

---

## 1) RAG reliability: “content exists” vs “content is retrieved”

Two failure modes look identical to users:

- **Content is missing** (not ingested / embeddings missing)
- **Content is present but not retrieved** (thresholds too strict, metadata parsing issues, query mismatch)

### What worked

- **Admin-only substring search (validation)**
  - Proves text is present in the DB, independent of vector similarity.
- **Stats endpoint (diagnostics)**
  - Quickly shows ingestion counts + embedding health.

### Lessons

- **Vector thresholds are product decisions**
  - Too strict = “it’s in the KB but I never see it.”
- **Always harden metadata parsing**
  - Treat metadata as untrusted: parse safely and default to `{}`.

---

## 2) PDF/DOCX ingestion: extraction quality matters

### Lessons

- **Scanned PDFs frequently produce no text**
  - That’s not a bug in vector search; it’s an extraction limitation.
- **Clear admin error messages reduce wasted debugging time**
  - Tell the admin when the document likely needs OCR.

---

## 3) Admin-only access: keep business logic server-side

### Lessons

- Admin routes should be enforced server-side using the authenticated session + `ADMIN_EMAIL`.
- Avoid putting authorization logic in the client. The UI can hide controls, but the server must enforce.

---

## 4) Insights stability: make dev environments resilient

### What went wrong

- Insights overview returned 500s due to:
  - schema mismatch/missing table in local dev
  - runtime type mismatch for `lastHit` (string vs Date)

### Lessons

- **Dev should fail “soft” where possible**
  - Prefer returning an empty payload (with dev-only `details`) so the UI still renders.
- **Defensively normalize DB return types**
  - Don’t assume timestamps are always JS `Date` objects.

---

## 5) “Top Chunks” requires stable chunk identifiers

### What went wrong

- `Top Chunks` can show empty even when hits exist if `knowledge_events.chunkId` is null.

### Lessons

- **Every retrieval result must have a stable `chunkId`**
  - Manual/PDF: use the row id (e.g. `Document_Knowledge:123`).
  - Website chunks: use a deterministic hash over `(sourceTable, url, contentPrefix)`.

This enables:

- chunk-level ranking
- regression testing for KB edits
- identifying “hot” chunks to refine or expand

---

## 6) SSR hydration mismatches: focus on determinism

### What went wrong

Hydration warnings were caused by:

- **Non-determinism in SSR** (e.g. `Math.random()`)
- **Client-only branching during initial render** (e.g. immediate width-dependent rendering)
- **Browser extensions injecting attributes** (e.g. Grammarly)

### Lessons

- **SSR render output must be deterministic**
  - Replace `Math.random()` with deterministic ids or stable values.
- **Avoid differing initial markup between server and first client render**
  - Initialize window size hooks without a value, then render responsively after hydration.
- **Extensions will mutate DOM**
  - Use `suppressHydrationWarning` at the right root elements to avoid noisy false-positives.

---

## 7) Scaling considerations (tables, indexes, retention)

### What grows fastest

- `Message_v2` and `knowledge_events` will grow the quickest with usage.

### Practical mitigations

- **Indexing** on the main filter columns (`createdAt`, `chatId`, `hit`, `sourceType/sourceId`, `chunkId`).
- **Pagination** for any admin list views.
- **Retention/rollups**
  - Keep raw `knowledge_events` for a window (e.g., 30–90 days) and roll up daily aggregates if needed.
- **pgvector indexing** for large vector tables (`website_content`, `Document_Knowledge`).

---

## 8) Quick verification checklist

- **Ingestion works**
  - Upload PDF/DOCX, verify counts increase and embeddings exist.
- **Retrieval works**
  - Ask targeted questions; verify citations/sources.
- **Insights works**
  - `hitRatio`, `topSources`, `missingKnowledge`, `topChunks` populate after a few chats.
- **No hydration errors**
  - Load `/chat` and `/admin` with no hydration mismatch warnings.
