# Technical Debt - NY AI Chatbot

**Last Updated:** February 17, 2026

---

## Active Items

### Clerk Custom Domain SSL Certificates Stuck in Issuance

- **Severity:** Low (no immediate impact)
- **Status:** Waiting on Clerk support
- **Date Identified:** February 17, 2026
- **Description:** After configuring Clerk custom domain for `nyenglishteacher.com`, SSL certificate issuance is stuck in "Issuing SSL certificates" state for both Frontend API (`clerk.nyenglishteacher.com`) and Account portal (`accounts.nyenglishteacher.com`).
- **DNS Status:** All 5/5 CNAME records verified by Clerk. No CAA records blocking. DNS hosted on Hover (not Cloudflare, so no proxy issue).
- **Impact:** Auth works fine currently via Clerk's shared infrastructure. Without custom domain SSL active:
  - Auth cookies may be treated as **third-party cookies** by browsers (Safari, Firefox, eventually Chrome)
  - Could cause unexpected session loss or login failures, especially on Safari/iOS
  - Ad blockers/privacy extensions may block Clerk's generic auth domains
  - No branding on auth endpoints (cosmetic)
- **No security vulnerability** — traffic is still TLS-encrypted through Clerk's shared infra
- **Resolution:** Contact Clerk support to force re-issue certificates on their end. Reference their Dec 2, 2025 SSL issuance delay incident (same symptoms). Do NOT remove and re-add the domain — that requires re-verifying all 5 CNAME records and risks auth downtime.

---

### Rate Limiting Uses In-Memory Storage

- **Severity:** Medium
- **Status:** Open
- **Description:** Rate limiting currently uses in-memory storage, which resets on each deployment and doesn't work across multiple serverless function instances.
- **Impact:** Rate limits are not enforced reliably in production on Vercel's serverless environment.
- **Resolution:** Implement Redis-backed rate limiting (e.g., Upstash Redis).

### CORS Origins Hardcoded

- **Severity:** Low
- **Status:** Open
- **Description:** Allowed CORS origins are hardcoded in `lib/security/cors.ts`.
- **Impact:** Adding new allowed domains requires a code change and deployment.
- **Resolution:** Move to environment variable or database-driven CORS configuration.

### Deprecated v1 Message Schema in Codebase

- **Severity:** Low
- **Status:** Open
- **Description:** The deprecated v1 message schema (`Message` table) still exists in the codebase alongside the current `Message_v2`.
- **Impact:** Code clutter, potential confusion for developers.
- **Resolution:** Remove v1 schema and any references once confirmed no data depends on it.

### Console.log Statements Need Structured Logging

- **Severity:** Low
- **Status:** Open
- **Description:** Application uses `console.log` throughout instead of a structured logging solution.
- **Impact:** Difficult to filter, search, and monitor logs in production.
- **Resolution:** Implement structured logging (e.g., Pino, Winston) with log levels and JSON output.
