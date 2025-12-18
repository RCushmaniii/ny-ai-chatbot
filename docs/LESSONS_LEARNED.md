# Lessons Learned (RAG, Admin Insights, and SSR Stability)

**Last Updated:** December 18, 2025

This document captures practical lessons learned while validating and troubleshooting the RAG knowledge upload/retrieval system and the Admin Insights dashboard.

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
