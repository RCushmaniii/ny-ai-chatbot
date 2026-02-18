# SaaS RAG Chatbot — Lessons Learned & Handoff Notes

Compiled from building ny-ai-chatbot. Use this as a reference for the new SaaS product.

---

## Security — What We Got Wrong (Fix These From Day One)

### Authentication & Authorization
- **Every admin API endpoint must check auth as its first line of code.** We had admin routes that only checked "is user logged in" but not "is this user actually the admin." Authenticated != authorized.
- **Never use `NEXT_PUBLIC_` prefix for anything auth-related.** It gets bundled into client-side JS. Use server-only env vars for all security config.
- **No hardcoded fallback values for security config.** If `ADMIN_EMAIL` is missing, throw at startup — don't silently fall back to a default email that could be exploited.
- **Validate env var format, not just presence.** A placeholder like `sk-your-openai-api-key-here` passes existence checks but fails at runtime.

### Input & Injection
- **Prompt injection regex is security theater.** We have 6 patterns (e.g., "ignore previous instructions") that are trivially bypassed with Unicode, paraphrasing, or other languages. Use them for logging/alerting, not as a security gate. Real mitigations: strong system prompts, output monitoring, and optionally an LLM-based classifier.
- **2000-character message limit** with whitespace normalization — good baseline for any chat API.
- **Sanitize uploaded filenames.** Strip non-alphanumeric characters and prefix with a UUID before passing to any storage backend.

### Rate Limiting
- **In-memory rate limiting is useless on serverless (Vercel, Lambda).** Every cold start resets counters. Multiple instances = multiple independent counters. Use Redis (Upstash is cheap) from day one — make it required, not optional.
- **Rate limit EVERY API surface that calls a paid API.** We had rate limiting on `/api/chat` but not on `/api/embed/chat` — the public-facing embed endpoint had zero protection.
- **Session-based limits (20 messages/session) + IP-based limits (10/min, 50/hr) + daily entitlements** — use all three layers.

### CORS & Headers
- **Whitelist CORS origins explicitly.** For multi-tenant SaaS, make this database-driven so new client domains can be added via admin panel.
- **Add security headers on day one:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (except embed routes), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **`postMessage` must specify target origin.** Never use `"*"` — it lets any parent frame receive messages.

### Sessions & Cookies
- `httpOnly: true` — no JS access to session tokens
- `secure: true` in production — HTTPS only
- `sameSite: "lax"` — CSRF protection
- **Embed widget gotcha:** iframe cookies from a different domain are treated as third-party cookies (blocked by Safari/Firefox). Use URL-based session tokens or same-domain deployment for embeds.

### Error Handling
- **Never expose infrastructure details in error messages.** No stack traces, no env var names, no service names to end users. Log details server-side, return generic messages to clients.

---

## UX/UI — What We Fixed

### Auth State: Server → Client
- Next.js server components can read auth state, but client components can't call server functions.
- **Pattern:** Server layout reads auth, passes `isAuthenticated: boolean` to a React context provider. Client components consume via `useChatLayout()` hook.
- This is the correct bridge pattern for Next.js App Router.

### Sidebar Visibility
- Anonymous users shouldn't see an empty sidebar ("conversations will appear" on a blank screen is bad UX).
- Admin routes shouldn't show the chat sidebar either.
- **Fix:** Conditionally render sidebar based on auth state + pathname checks.

### Admin Dashboard
- **Redundant headers:** After migrating to Clerk, the custom `AdminHeader` (with its own avatar/dropdown/logout) became redundant with Clerk's built-in `UserButton`. Remove custom auth UI when the auth provider handles it.
- **Tab overflow:** 9 admin tabs in a fixed grid overflow on mobile. Use `overflow-x-auto` with flex layout and icon-only display on small screens.
- **Form sizing:** Oversized textareas and full-width buttons on wide screens look bad. Use `rows={4}` with `resize-y`, and constrain buttons with `max-w-xs`.
- **Content width:** Admin content needs `max-w-5xl mx-auto` — unconstrained full-width layouts look unprofessional on large monitors.

### Sign-In UX
- Anonymous users need a visible, prominent sign-in option. Use `variant="default"` (primary color), not `variant="outline"`.
- Show brand name + sign-in button in the header for signed-out users.

### Hydration Issues (Next.js)
- `Math.random()` in SSR causes mismatches — use deterministic IDs.
- Radix UI generates incrementing IDs that differ server vs client — gate behind a `mounted` state flag.
- Browser extensions (Grammarly) inject DOM attributes — use `suppressHydrationWarning` at root.
- **Test with `pnpm build && pnpm start` regularly** — dev mode doesn't always surface hydration warnings.

---

## RAG System — What Works Well

### Architecture
```
User query → Embed (text-embedding-3-small, 1536 dims)
  → Search source 1: website_content (cosine similarity > 0.5)
  → Search source 2: Document_Knowledge (top 20, filter at >= 0.25)
  → Merge, deduplicate, sort by similarity, take top 5
  → Keyword fallback if zero vector results
  → Log hit/miss to knowledge_events table
  → Inject context into system prompt with source URLs
```

### Good Patterns to Keep
- **Dual-source search** with different thresholds per source type (curated content can use lower threshold)
- **Embedding cache** (5-min TTL, 100 entries) to prevent repeated embedding calls
- **Keyword fallback** when vector search returns nothing
- **Mandatory RAG call** — system prompt requires the bot to search before answering business questions
- **Source citations** — every answer must include "Learn more:" links
- **URL translation** — auto-swap `/en/` ↔ `/es/` based on detected language
- **Stable chunk IDs** via SHA-1 hash for analytics tracking
- **knowledge_events table** logging every search (hit/miss, relevance, source) — powers the Insights dashboard

### What to Improve
- Keyword fallback assigns `0.99` similarity to all matches, which can outrank genuinely relevant vector results. Use a lower fake score (e.g., `0.4`).
- `MANUAL_SIMILARITY_THRESHOLD` at `0.25` is very low — may surface irrelevant content. Start at `0.5` and tune down.
- Embedding cache is in-memory (resets on cold start). For SaaS scale, use Redis.
- Track actual token counts from AI SDK response metadata, not flat $0.01/message estimates.

---

## Database & Migrations — Pitfalls

- **Don't mix migration tools.** We used Drizzle ORM migrations AND hand-written SQL files. The hand-written ones weren't registered in Drizzle's `_journal.json`, so `pnpm db:migrate` didn't know about them. Production broke because a column existed in code but not in the database. Pick one migration tool and use it exclusively.
- **Schema debt compounds.** We still have deprecated v1 tables (`Message`, `Vote`) alongside v2. Set a hard deadline for removal.
- **Normalize timestamp types after fetch.** PostgreSQL timestamps come back as `string` or `Date` depending on the query path. Normalize immediately.
- **Don't build data storage for features you haven't built the display layer for.** We stored `botName`, `starterQuestions`, and `welcomeMessage` in the database but never wired them to the chat UI. Partial features confuse admins.

---

## Deployment — Gotchas

### Vercel-Specific
- **AI SDK v2 routes through Vercel AI Gateway by default** when deployed on Vercel. This requires credit card setup. Fix: set explicit `baseURL: "https://api.openai.com/v1"` in your OpenAI provider config.
- **Trailing newlines in env vars from `echo`.** When setting env vars via CLI: `echo "value" | vercel env add VAR` appends `\n`. Use `printf` instead, or use the Vercel dashboard.
- **Centralize your AI provider** in one file (`lib/ai/openai.ts`). When config needs to change, you update one file instead of 10+.

### Clerk-Specific
- **Clerk validates keys at module import time.** In CI without valid keys, importing `@clerk/nextjs/server` throws. Fix: dynamic imports with test-mode short-circuits.
- **Clerk avatar images need `img.clerk.com` in Next.js `remotePatterns`** — or they'll be blocked.
- **Clerk API deprecations are frequent.** `afterSignInUrl` → `signInFallbackRedirectUrl`, `afterSignOutUrl` → `signInUrl`. Check changelog on every upgrade.
- **Custom domain SSL can get stuck.** Budget extra time for DNS propagation and provider-side SSL issuance.

---

## Revenue-Driving Design Patterns

These are baked into the current chatbot and should carry forward to the SaaS product:

1. **Booking CTAs in system prompt** — bot is instructed to offer booking links in every relevant response
2. **Rate limit messages are CTAs** — when users hit the message limit, the error includes a booking link
3. **Source citations drive traffic** — every RAG answer ends with "Learn more:" links back to the client's website
4. **Embed widget = lead generator** — drops onto any page with one `<script>` tag
5. **Pricing transparency** — bot gives exact pricing to reduce friction
6. **Geolocation awareness** — serves the right currency/language automatically
7. **Missing knowledge insights** — shows what content gaps exist (each gap = potential lost sale)

---

## Architecture Decisions for the New SaaS

| Decision | Recommendation |
|----------|---------------|
| Auth provider | Choose one at project start. Don't migrate later. Wrap all auth calls in your own functions for testability. |
| Rate limiting | Redis (Upstash) required from day one. Not optional. |
| CORS origins | Database-driven for multi-tenant. Not env vars. |
| Migrations | One tool only. No mixing Drizzle + raw SQL. |
| Env validation | Fail fast at startup with format validation, not just presence checks. |
| Prompt injection | Log and alert, don't block. Regex can't stop a determined attacker. |
| RAG analytics | Log every search from day one. Build the "missing knowledge" report early. |
| Token tracking | Use AI SDK response metadata for real costs, not estimates. |
| Embed widget | iframe approach works. Plan for third-party cookie restrictions. |
| Error messages | Generic to users, detailed to server logs. |
| Test mode | Build auth bypass infrastructure before writing first test. |
