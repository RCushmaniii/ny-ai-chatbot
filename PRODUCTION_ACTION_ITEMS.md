# Production Action Items - NY AI Chatbot

**Last Updated:** January 11, 2026
**Target:** Live integration with ny-eng website

---

## Priority Legend
- **P0 - CRITICAL:** Must complete before go-live
- **P1 - HIGH:** Should complete before go-live
- **P2 - MEDIUM:** Complete within first week
- **P3 - LOW:** Nice to have, can be done later

---

## P0 - CRITICAL (Block Go-Live)

### 1. CORS Configuration for ny-eng
**File:** `lib/security/cors.ts`
**Status:** [x] COMPLETED (Jan 11, 2026)

**Changes Made:**
- Added ny-eng.vercel.app domains
- Added chat.nyenglishteacher.com
- Added environment variable support: `ALLOWED_ORIGINS`
- Added localhost:4321 for Astro development

```typescript
// Now supports environment-based configuration:
// ALLOWED_ORIGINS=https://custom-domain.com,https://staging.site.com
```

**Estimated Effort:** 30 minutes (actual: 15 min)

---

### 2. Environment Variables Verification
**Status:** [ ] Not Started

**Required Variables:**
- [ ] `POSTGRES_URL` - Production database connection
- [ ] `OPENAI_API_KEY` - Valid API key with sufficient credits
- [ ] `AUTH_SECRET` - Generated secure secret
- [ ] `ADMIN_EMAIL` - Admin user email
- [ ] `ADMIN_PASSWORD` - Strong admin password
- [ ] `NEXT_PUBLIC_APP_URL` - Production chatbot URL

**Verification Steps:**
- [ ] All variables set in Vercel dashboard
- [ ] Database accessible from Vercel
- [ ] OpenAI API key has billing enabled
- [ ] Test admin login works

**Estimated Effort:** 1 hour

---

### 3. Database Migrations
**Status:** [ ] Not Started

**Action Required:**
- [ ] Verify all migrations applied to production database
- [ ] Run `pnpm db:migrate` against production if needed
- [ ] Verify pgvector extension is installed
- [ ] Confirm admin user exists via `pnpm create-admin`

**Commands:**
```bash
# Check migration status
pnpm db:check

# Apply migrations
pnpm db:migrate

# Create admin user
pnpm create-admin
```

**Estimated Effort:** 30 minutes

---

### 4. Knowledge Base Population
**Status:** [ ] Not Started

**Action Required:**
- [ ] Ingest nyenglishteacher.com sitemap content
- [ ] Add any manual content via admin panel
- [ ] Verify RAG search returns relevant results
- [ ] Test both English and Spanish queries

**Admin Panel Steps:**
1. Go to `/admin`
2. Click "Website Scraping" tab
3. Enter sitemap URL
4. Click "Run Ingestion"
5. Verify stats show content count

**Estimated Effort:** 2 hours

---

## P1 - HIGH (Complete Before Go-Live)

### 5. Rate Limiting Enhancement
**File:** `lib/security/rate-limit-redis.ts` (NEW), `lib/security/validation.ts`
**Status:** [x] COMPLETED (Jan 11, 2026)

**Changes Made:**
- Installed `@upstash/ratelimit` and `@upstash/redis`
- Created `lib/security/rate-limit-redis.ts` with Redis-backed rate limiting
- Automatic fallback to in-memory when Redis not configured
- Updated chat route to use async `checkRateLimitRedis()`
- Per-minute (10 req) and per-hour (50 req) limits

**Env vars needed:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Estimated Effort:** 2-4 hours (actual: 45 min)

---

### 6. Admin Access Security
**File:** `app/(chat)/admin/layout.tsx` (NEW), `app/(chat)/admin/page.tsx`
**Status:** [x] COMPLETED (Jan 11, 2026)

**Changes Made:**
- Created server-side `layout.tsx` with admin check
- Admin email now read from `ADMIN_EMAIL` (server-only, not exposed)
- Removed client-side admin email check from page.tsx
- Auth verified server-side before page renders

**Estimated Effort:** 1-2 hours (actual: 30 min)

---

### 7. Error Monitoring Setup
**Status:** [x] COMPLETED (Jan 11, 2026)

**Changes Made:**
- Installed `@sentry/nextjs`
- Created `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Updated `next.config.ts` with Sentry webpack config
- Created `app/global-error.tsx` for React error boundary
- Sentry only activates when `SENTRY_DSN` env var is set

**Env vars needed:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`

**Estimated Effort:** 1-2 hours (actual: 30 min)

---

### 8. Embed Widget Testing
**Status:** [ ] Not Started

**Test Checklist:**
- [ ] Widget loads on ny-eng staging
- [ ] Chat opens/closes correctly
- [ ] Messages send and receive
- [ ] Knowledge base results appear
- [ ] Source URLs are correct
- [ ] Language detection works (EN/ES)
- [ ] Mobile responsive

**Test Pages:**
- [ ] Homepage embed
- [ ] Services page embed
- [ ] Blog page embed

**Estimated Effort:** 2-3 hours

---

## P2 - MEDIUM (First Week Post-Launch)

### 9. Database Index Optimization
**File:** `lib/db/migrations/0010_analytics_indexes.sql` (NEW)
**Status:** [x] COMPLETED (Jan 11, 2026)

**Changes Made:**
- Created migration with indexes for:
  - `knowledge_events`: chatId, createdAt, sessionId, hit, composite analytics
  - `chat_analytics`: sessionId, lastActivityAt, createdAt
  - `Chat`: sessionId, userId, createdAt
  - `Message_v2`: chatId, createdAt

**Run migration:** `psql $POSTGRES_URL -f lib/db/migrations/0010_analytics_indexes.sql`

**Estimated Effort:** 30 minutes (actual: 15 min)

---

### 10. Remove Debug Logging
**File:** `app/(chat)/api/chat/route.ts`
**Status:** [x] COMPLETED (Jan 11, 2026)

**Changes Made:**
- Removed emoji debug logs (language detection, knowledge results, URL translation)
- Kept error logging only in development mode using `isProductionEnvironment` check
- Removed commented-out resumable streams code

**Estimated Effort:** 1 hour (actual: 15 min)

---

### 11. Clean Up Deprecated Schema
**Files:** `lib/db/migrations/0011_cleanup_deprecated_tables.sql` (NEW), `lib/reports/daily-usage.ts`, `check-db-status.ts`
**Status:** [x] COMPLETED (Jan 11, 2026)

**Changes Made:**
- Updated `daily-usage.ts` to use `Message_v2` instead of deprecated `Message`
- Updated `check-db-status.ts` to use `Message_v2`
- Fixed JSONB queries for `parts` column (v2 schema)
- Created migration `0011_cleanup_deprecated_tables.sql` with commented DROP statements
- Tables can be dropped manually after verifying data migration

**Note:** DROP statements are commented out - review and uncomment after verification

**Estimated Effort:** 1 hour (actual: 30 min)

---

### 12. Add Pre-deployment Check Script
**File:** `lib/env-validation.ts` (NEW), `instrumentation.ts`
**Status:** [x] COMPLETED (Jan 11, 2026)

**Changes Made:**
- Created `lib/env-validation.ts` with startup validation
- Validates: POSTGRES_URL, OPENAI_API_KEY, AUTH_SECRET (required)
- Warns about: ADMIN_EMAIL, REDIS_URL, ALLOWED_ORIGINS (optional)
- Integrated into `instrumentation.ts` for startup validation
- App will fail fast if critical env vars missing

**Estimated Effort:** 30 minutes (actual: 20 min)

---

## P3 - LOW (Future Enhancements)

### 13. Add Unit Test Coverage
**Status:** [ ] Not Started

**Action Required:**
- [ ] Set up Vitest or Jest
- [ ] Add tests for utility functions
- [ ] Add tests for API routes
- [ ] Configure coverage reporting

**Estimated Effort:** 4-8 hours

---

### 14. Content Security Policy
**Status:** [ ] Not Started

**Action Required:**
- [ ] Add CSP headers in `next.config.ts`
- [ ] Configure for embed iframe sources
- [ ] Test widget still works

**Estimated Effort:** 2 hours

---

### 15. Admin Audit Logging
**Status:** [ ] Not Started

**Action Required:**
- [ ] Create `admin_audit_log` table
- [ ] Log all admin actions (login, settings changes, content updates)
- [ ] Add viewer in admin panel

**Estimated Effort:** 4-6 hours

---

### 16. Multi-Model Support
**Status:** [ ] Not Started (Per roadmap)

**Future Feature:**
- Add Claude, Gemini model options
- Model selector in admin panel
- Per-model prompt adjustments

**Estimated Effort:** 8-16 hours

---

## Integration Checklist for ny-eng

### Pre-Integration
- [x] CORS configured for ny-eng domains
- [ ] Embed widget tested in isolation
- [ ] Admin credentials documented securely
- [ ] Backup plan if issues arise

### Integration Steps
1. [ ] Add embed script to ny-eng staging
2. [ ] Test all pages where widget appears
3. [ ] Verify mobile responsiveness
4. [ ] Test both languages (EN/ES)
5. [ ] Confirm knowledge base responses are accurate
6. [ ] Deploy to ny-eng production
7. [ ] Monitor for errors (first 24 hours)

### Post-Integration
- [ ] Document embed configuration
- [ ] Set up monitoring alerts
- [ ] Create runbook for common issues
- [ ] Schedule first analytics review (1 week)

---

## Quick Reference: Embed Code

```html
<script
  src="https://ny-ai-chatbot.vercel.app/api/embed"
  data-language="en"
  data-button-color="#2563eb"
  data-welcome-message="Hello! How can I help you today?"
  data-placeholder="Type your message..."
  data-bot-icon="🎓"
  data-position="bottom-right"
  async
></script>
```

---

## Contacts & Resources

- **Chatbot Admin:** https://ny-ai-chatbot.vercel.app/admin
- **Documentation:** `/docs/` folder in repo
- **Testing Checklist:** `/docs/TESTING_CHECKLIST.md`
- **Deployment Guide:** `/docs/PRODUCTION_DEPLOYMENT_GUIDE.md`

---

## Progress Tracking

| Category | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| P0 Critical | 4 | 1 | 3 |
| P1 High | 4 | 3 | 1 |
| P2 Medium | 4 | 4 | 0 |
| P3 Low | 4 | 0 | 4 |
| **Total** | **16** | **8** | **8** |

### Completed Items (Jan 11, 2026)
- [x] #1 CORS Configuration - ny-eng domains added + env var support
- [x] #5 Rate Limiting - Redis-backed with Upstash + in-memory fallback
- [x] #6 Admin Access Security - server-side auth in layout.tsx
- [x] #7 Error Monitoring - Sentry integration configured
- [x] #9 Database Indexes - migration created for analytics tables
- [x] #10 Debug Logging - removed console.logs, cleaned commented code
- [x] #11 Deprecated Schema - updated to v2 tables, cleanup migration ready
- [x] #12 Pre-deployment Check - env validation at startup

### New Packages Added
- `@sentry/nextjs` - Error monitoring
- `@upstash/ratelimit` - Redis rate limiting
- `@upstash/redis` - Redis client

### New Environment Variables (Optional)
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking
- `SENTRY_ORG` / `SENTRY_PROJECT` - Sentry source maps
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Rate limiting

---

*Last reviewed: January 11, 2026*
