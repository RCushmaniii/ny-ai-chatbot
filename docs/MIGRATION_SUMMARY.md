# Single-Tenant Migration Summary

## ✅ Phase 1: Database Migrations (COMPLETED)

### Files Created

1. **`migrations/000_enable_extensions.sql`**

   - Enables pgcrypto extension for UUID generation
   - Safe to run multiple times

2. **`migrations/001_bot_settings_global.sql`**

   - Removes `userId` column from `bot_settings`
   - Adds `is_active` boolean for singleton pattern
   - Creates unique index to enforce single active row
   - Consolidates existing rows into one active settings

3. **`migrations/002_chat_sessionid.sql`**

   - Adds `sessionId` VARCHAR(64) to `Chat` table
   - Makes `userId` nullable (allows anonymous chats)
   - Creates indexes for session-based queries

4. **`migrations/003_analytics_table.sql`**

   - Creates `chat_analytics` table
   - Tracks: message count, knowledge hits, response time, language
   - Indexes for efficient analytics queries

5. **`migrations/004_migrate_existing_chats.sql`**
   - Backfills `sessionId` for existing chats
   - Deterministic sessionId for chats with userId
   - Random sessionId for orphaned chats

### Helper Scripts

- **`migrations/run-migrations.ps1`** - PowerShell script to run all migrations
- **`migrations/rollback.sql`** - Emergency rollback (use with caution)
- **`migrations/README.md`** - Updated with migration instructions

### Code Updates

1. **`lib/db/schema.ts`**

   - ✅ Updated `chat` table: added `sessionId`, made `userId` optional
   - ✅ Updated `botSettings` table: removed `userId`, added `is_active`
   - ✅ Added `chatAnalytics` table definition

2. **`lib/db/queries.ts`**

   - ✅ Added `getGlobalBotSettings()` - Get singleton settings
   - ✅ Added `updateGlobalBotSettings()` - Upsert global settings
   - ✅ Added `getChatsBySessionId()` - Get chats by session
   - ✅ Added `getAllChats()` - Admin view of all chats
   - ✅ Added `getMessageCountBySessionId()` - Rate limiting by session

3. **`lib/session.ts`** (NEW)
   - ✅ `getOrCreateSessionId()` - Cookie-based session management
   - ✅ `getSessionId()` - Get existing session
   - ✅ `clearSession()` - Logout
   - ✅ `refreshSession()` - Extend session lifetime

---

## 🔄 Phase 2: Code Migration (IN PROGRESS)

### Next Steps

#### 1. Update Admin Settings API

**File:** `app/api/admin/settings/route.ts`

```typescript
// BEFORE (multi-tenant)
const settings = await db
  .select()
  .from(botSettings)
  .where(eq(botSettings.userId, session.user.id))
  .limit(1);

// AFTER (single-tenant)
import { getGlobalBotSettings } from "@/lib/db/queries";
const settings = await getGlobalBotSettings();
```

#### 2. Update Chat API

**File:** `app/(chat)/api/chat/route.ts`

```typescript
// BEFORE
const session = await auth();
if (!session?.user) {
  return new ChatSDKError("unauthorized:chat").toResponse();
}

// AFTER
import { getOrCreateSessionId } from "@/lib/session";
const sessionId = await getOrCreateSessionId();
// No auth required for main chat
```

#### 3. Update Chat Creation

```typescript
// BEFORE
await saveChat({
  id,
  userId: session.user.id,
  title,
  visibility: selectedVisibilityType,
});

// AFTER
await saveChat({
  id,
  sessionId, // Use sessionId instead of userId
  title,
  visibility: selectedVisibilityType,
});
```

#### 4. Update Rate Limiting

```typescript
// BEFORE
const messageCount = await getMessageCountByUserId({
  id: session.user.id,
  differenceInHours: 24,
});

// AFTER
const messageCount = await getMessageCountBySessionId({
  sessionId,
  differenceInHours: 24,
});
```

#### 5. Update Sidebar History

**File:** `components/sidebar-history.tsx`

```typescript
// BEFORE
const { chats } = await getChatsByUserId({ id: session.user.id });

// AFTER
const sessionId = await getSessionId();
if (sessionId) {
  const chats = await getChatsBySessionId({ sessionId });
}
```

---

## 📊 Phase 3: Admin Dashboard Enhancements (PENDING)

### New Components to Create

1. **`components/admin-analytics.tsx`**

   - Total chats/messages (7/30 days)
   - Language breakdown (EN vs ES)
   - Knowledge base hit rate
   - Response time trends
   - Most common questions

2. **`components/admin-chat-logs.tsx`**

   - List all chats (paginated)
   - Filter by date, language, session
   - Search by content
   - View full conversation
   - Export to CSV

3. **`app/api/admin/chats/route.ts`**

   - GET - List all chats with filters
   - GET /[id] - Get full chat transcript

4. **Update `components/admin-tabs.tsx`**
   - Add "Analytics" tab
   - Add "Chat Logs" tab

---

## 🧪 Testing Checklist

### Before Running Migrations

- [ ] Backup database: `pg_dump $POSTGRES_URL > backup.sql`
- [ ] Document current bot settings
- [ ] Export existing chat data (optional)

### After Running Migrations

- [ ] Verify singleton settings: `SELECT COUNT(*) FROM bot_settings WHERE is_active = true;` (should be 1)
- [ ] Verify sessionIds: `SELECT COUNT(*) FROM "Chat" WHERE "sessionId" IS NULL;` (should be 0)
- [ ] Verify analytics table: `SELECT COUNT(*) FROM chat_analytics;` (should be 0 initially)

### Code Testing

- [ ] Anonymous chat works (no login required)
- [ ] Session persists across page refreshes
- [ ] Admin login still works
- [ ] Bot settings update correctly
- [ ] Chat history shows for session
- [ ] Knowledge base search works
- [ ] Embed widget still works

---

## 🚀 Deployment Steps

### Local Testing

```powershell
# 1. Set database URL
$env:POSTGRES_URL = "your-local-postgres-url"

# 2. Run migrations
.\migrations\run-migrations.ps1

# 3. Start dev server
pnpm dev

# 4. Test anonymous chat at http://localhost:3000
# 5. Test admin at http://localhost:3000/admin
```

### Production Deployment

```powershell
# 1. Backup production database
pg_dump $env:POSTGRES_URL > "backup_production_$(Get-Date -Format 'yyyyMMdd').sql"

# 2. Run migrations on production
.\migrations\run-migrations.ps1

# 3. Deploy code to Vercel
git push origin main

# 4. Verify deployment
# - Test anonymous chat
# - Test admin login
# - Check analytics
```

---

## 📋 Rollback Plan

If something goes wrong:

```powershell
# 1. Restore from backup
psql $env:POSTGRES_URL < backup_production_YYYYMMDD.sql

# 2. Or use rollback script (partial)
psql $env:POSTGRES_URL -f .\migrations\rollback.sql

# 3. Revert code changes
git revert HEAD
git push origin main
```

**Warning:** Rollback will not restore deleted data. Always backup first!

---

## 🎯 Success Criteria

- ✅ Database migrations run without errors
- ✅ All chats have sessionId
- ✅ Bot settings is singleton (one active row)
- ✅ Anonymous users can chat
- ✅ Sessions persist via cookies
- ✅ Admin can access dashboard
- ✅ Chat history works
- ✅ Analytics track usage
- ✅ No TypeScript errors
- ✅ All tests pass

---

## 📞 Support

If you encounter issues:

1. Check `migrations/README.md` for troubleshooting
2. Review error logs in Vercel dashboard
3. Verify database connection
4. Check that all migrations ran successfully
5. Restore from backup if needed

---

**Status:** Phase 1 Complete ✅  
**Next:** Update chat API and admin settings  
**Last Updated:** December 9, 2024
