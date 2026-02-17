# Security Hardening Report

**Date:** 2026-02-16
**Auditor:** Claude Code (automated security review)
**Status:** All fixes applied and verified (build passing)

---

## Summary

A comprehensive security audit identified **20 issues** across the public-facing surface area of the NY AI Chatbot. All critical, high, and medium issues have been fixed. This document records what was found, what was fixed, and what remains as ongoing recommendations.

---

## Fixed Issues

### CRITICAL

#### 1. Unauthenticated `/api/knowledge/search` endpoint
- **File:** `app/(chat)/api/knowledge/search/route.ts`
- **Risk:** Anyone could POST to this endpoint with zero auth, dump the entire knowledge base, and burn OpenAI API credits generating embeddings.
- **Fix:** Added admin authentication check (`session.user.email === getAdminEmail()`). Also parameterized the `limit` query to prevent abuse and clamped it to max 20.

#### 2. SQL injection via `client.unsafe()` with string interpolation
- **Files:** `lib/ai/tools/search-knowledge.ts`, `app/api/admin/knowledge/route.ts`
- **Risk:** `client.unsafe()` bypasses the postgres.js library's parameterization. Embedding vectors and the `LIMIT` clause were interpolated directly into SQL strings. While the embedding source (OpenAI) is trusted, the pattern is dangerous and the `limit` in the knowledge search was user-controlled.
- **Fix:** Replaced all `client.unsafe()` calls with parameterized tagged template literals (`client\`...\``). The postgres.js library automatically parameterizes values in tagged templates.

### HIGH

#### 3. Open redirect in guest authentication
- **File:** `app/(auth)/api/auth/guest/route.ts`
- **Risk:** The `redirectUrl` query parameter was not validated. An attacker could craft `?redirectUrl=https://evil.com` to redirect users to a phishing page after guest sign-in.
- **Fix:** Added validation to only allow relative paths (`rawRedirect.startsWith("/")`). Any absolute URL is replaced with `/`.

#### 4. No rate limiting on `/api/embed/chat`
- **File:** `app/api/embed/chat/route.ts`
- **Risk:** This public endpoint calls OpenAI on every request with zero rate limiting, unlike the main `/api/chat` endpoint. An attacker could spam it to exhaust the OpenAI API quota.
- **Fix:** Added the same `checkRateLimitRedis()` + `validateMessage()` pattern used by the main chat API.

#### 5. Inconsistent admin auth checks across admin routes
- **Files:** `app/api/admin/analytics/route.ts`, `app/api/admin/settings/route.ts`, `app/api/admin/chat-logs/route.ts`, `app/api/admin/change-password/route.ts`, `app/api/admin/knowledge/rebuild/route.ts`, `app/api/admin/knowledge/ingest/route.ts`, `app/api/admin/knowledge/clear-website/route.ts`
- **Risk:** These routes only checked `session?.user` exists but did not verify the user's email matches the admin email. Any authenticated user (including guests) could potentially access admin functionality.
- **Fix:** Added `getAdminEmail()` email verification to all admin routes that were missing it.

#### 6. Hardcoded fallback admin email
- **Files:** All 7 files that contained `getAdminEmail()` function
- **Risk:** The `getAdminEmail()` function fell back to `process.env.NEXT_PUBLIC_ADMIN_EMAIL` (publicly visible in the browser bundle) and then to a hardcoded `"info@nyenglishteacher.com"`. If `ADMIN_EMAIL` was ever unset, anyone registering with that email would get admin access.
- **Fix:** Changed `getAdminEmail()` in all files to only use `process.env.ADMIN_EMAIL` and throw an error if it's not configured. Made `ADMIN_EMAIL` a required env var in `lib/env-validation.ts`.

#### 7. No security headers
- **File:** `next.config.ts`
- **Risk:** No `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy` headers. The admin panel was vulnerable to clickjacking via iframe embedding.
- **Fix:** Added security headers in `next.config.ts`:
  - `X-Content-Type-Options: nosniff` on all routes
  - `Referrer-Policy: strict-origin-when-cross-origin` on all routes
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` on all routes
  - `X-Frame-Options: DENY` on admin and chat routes (excluded embed routes which legitimately use iframes)

### MEDIUM

#### 8. Test/debug HTML files publicly accessible in production
- **Files:** `public/test.html`, `public/test-local.html`
- **Risk:** Exposed API structure, debug links, and internal testing checklists to the public.
- **Fix:** Deleted both files.

#### 9. CRON_SECRET was optional (unauthenticated cron execution)
- **File:** `app/api/cron/daily-report/route.ts`
- **Risk:** If `CRON_SECRET` was not set, anyone could hit `GET /api/cron/daily-report` and trigger the job + get usage statistics in the response.
- **Fix:** Made `CRON_SECRET` required. If unset, returns 500 instead of allowing unauthenticated access. Also made it a required env var in `lib/env-validation.ts`.

#### 10. `postMessage("close-chat", "*")` wildcard target origin
- **File:** `app/embed/chat/page.tsx`
- **Risk:** Sending postMessage to `"*"` means any origin can receive the message if the embed is loaded in an unexpected parent frame.
- **Fix:** Changed target origin to `process.env.NEXT_PUBLIC_APP_URL || window.location.origin`.

#### 11. Unsanitized upload filenames
- **File:** `app/(chat)/api/files/upload/route.ts`
- **Risk:** Client-controlled filenames were passed directly to Vercel Blob without sanitization, potentially enabling path traversal.
- **Fix:** Sanitized filenames by stripping non-alphanumeric characters and prepending a UUID: `${randomUUID()}-${sanitizedName}`.

#### 12. Error messages leaked infrastructure details
- **File:** `app/(chat)/api/chat/route.ts`
- **Risk:** Error messages told end users about Vercel, OpenAI, environment variables, and AI Gateway configuration. This reveals infrastructure details useful for targeted attacks.
- **Fix:** Replaced all infrastructure-specific error messages with generic user-facing messages (e.g., "Please contact the site administrator"). The detailed errors are still logged server-side via `console.error`.

### LOW

#### 13. Weak minimum password length (6 characters)
- **Files:** `app/api/admin/change-password/route.ts`, `components/admin-account.tsx`
- **Risk:** 6 characters is below NIST SP 800-63B recommendations for admin accounts.
- **Fix:** Raised minimum to 12 characters in both the server-side validation and client-side UI.

#### 14. Guest account creation not rate limited
- **File:** `app/(auth)/api/auth/guest/route.ts`
- **Risk:** No rate limiting meant an attacker could create unlimited guest user rows in the database via automated requests.
- **Fix:** Added `checkRateLimitRedis()` with a `guest:` prefix to the guest creation endpoint.

---

## Remaining Recommendations

These items were identified but not fixed in this pass, either because they require infrastructure changes or architectural decisions:

### Set up Upstash Redis for rate limiting
- **Current state:** Rate limiting falls back to in-memory storage, which resets on every Vercel serverless cold start and is not shared across instances. Effectively non-functional in production.
- **Action needed:** Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel environment variables. The code already supports this — it just needs the env vars.

### Content Security Policy (CSP)
- **Current state:** No CSP header is set. This means XSS payloads from AI responses have no browser-level containment.
- **Why not fixed:** The embed widget's iframe architecture requires careful CSP design to avoid breaking legitimate functionality. Adding CSP requires testing against all features.
- **Action needed:** Design a CSP policy that allows the embed iframe while restricting other script sources.

### Prompt injection detection is superficial
- **File:** `lib/security/validation.ts`
- **Current state:** Six regex patterns check for common prompt injection phrases, but they're trivially bypassed with Unicode characters, paraphrasing, or language switching.
- **Why not fixed:** Regex-based prompt injection defense is fundamentally limited. The real mitigation is a strong system prompt and output monitoring.
- **Recommendation:** Keep the patterns as a first-pass filter but don't rely on them. Consider adding an LLM-based guardrail for output monitoring via Sentry or a dedicated service.

### Consider Clerk for admin authentication
- **Current state:** Admin auth uses NextAuth 5 with a credentials provider (email/password).
- **Recommendation:** Switching to Clerk with Google OAuth would eliminate password management entirely and provide stronger admin authentication. This was raised as a potential improvement during the audit.

---

## Environment Variables After Hardening

### Now Required (newly added to required list)
| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Admin identity verification for all admin routes |
| `CRON_SECRET` | Authentication token for cron job requests |

### Strongly Recommended
| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Persistent rate limiting across serverless instances |
| `UPSTASH_REDIS_REST_TOKEN` | Auth token for Upstash Redis |

---

## Files Changed

| File | Change |
|------|--------|
| `app/(chat)/api/knowledge/search/route.ts` | Added admin auth, parameterized queries |
| `lib/ai/tools/search-knowledge.ts` | Replaced `client.unsafe()` with parameterized queries |
| `app/api/admin/knowledge/route.ts` | Replaced `client.unsafe()`, fixed `getAdminEmail()` |
| `app/(auth)/api/auth/guest/route.ts` | Fixed open redirect, added rate limiting |
| `app/api/embed/chat/route.ts` | Added rate limiting and message validation |
| `app/api/admin/analytics/route.ts` | Added admin email verification |
| `app/api/admin/settings/route.ts` | Added admin email verification (GET + POST) |
| `app/api/admin/chat-logs/route.ts` | Added admin email verification |
| `app/api/admin/change-password/route.ts` | Added admin email verification, raised password minimum to 12 |
| `app/api/admin/knowledge/rebuild/route.ts` | Added admin email verification |
| `app/api/admin/knowledge/ingest/route.ts` | Added admin email verification |
| `app/api/admin/knowledge/clear-website/route.ts` | Added admin email verification |
| `app/api/admin/knowledge/stats/route.ts` | Fixed `getAdminEmail()` |
| `app/api/admin/knowledge/pdf/route.ts` | Fixed `getAdminEmail()` |
| `app/api/admin/knowledge/docx/route.ts` | Fixed `getAdminEmail()` |
| `app/api/admin/insights/overview/route.ts` | Fixed `getAdminEmail()` |
| `app/api/admin/insights/questions/route.ts` | Fixed `getAdminEmail()` |
| `app/api/admin/insights/sources/route.ts` | Fixed `getAdminEmail()` |
| `next.config.ts` | Added security headers |
| `app/api/cron/daily-report/route.ts` | Required CRON_SECRET |
| `app/embed/chat/page.tsx` | Fixed postMessage wildcard origin |
| `app/(chat)/api/files/upload/route.ts` | Sanitized filenames with UUID prefix |
| `app/(chat)/api/chat/route.ts` | Redacted infrastructure details from error messages |
| `components/admin-account.tsx` | Raised password minimum to 12 characters |
| `lib/env-validation.ts` | Made ADMIN_EMAIL and CRON_SECRET required |
| `public/test.html` | **Deleted** |
| `public/test-local.html` | **Deleted** |
