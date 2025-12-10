# Database Migrations

## Single-Tenant Migration (December 2024)

This directory contains migrations to convert the chatbot from multi-tenant to single-tenant architecture.

### Migration Files

Execute in this order:

1. **000_enable_extensions.sql** - Enables required PostgreSQL extensions (pgcrypto)
2. **001_bot_settings_global.sql** - Converts bot_settings to global singleton (removes userId)
3. **002_chat_sessionid.sql** - Adds sessionId support for anonymous chats
4. **003_analytics_table.sql** - Creates chat_analytics table for metrics
5. **004_migrate_existing_chats.sql** - Backfills sessionId for existing chats

### Quick Start (Windows PowerShell)

```powershell
# Set your database URL
$env:POSTGRES_URL = "your-postgres-connection-string"

# Run all migrations
.\migrations\run-migrations.ps1

# Or dry run to see what would happen
.\migrations\run-migrations.ps1 -DryRun

# Skip backup (not recommended)
.\migrations\run-migrations.ps1 -Backup:$false
```

### Manual Execution (Vercel Dashboard)

1. Go to your Vercel Dashboard
2. Navigate to your project → Storage → Postgres
3. Click "Query" or "SQL Editor"
4. Copy and paste each `.sql` file **in order**
5. Execute each query

### What Changed

#### Before (Multi-Tenant)

- Users must log in to chat
- Each user has their own bot_settings
- Chats are tied to userId
- No anonymous access

#### After (Single-Tenant)

- Anonymous chat via sessionId (cookie-based)
- One global bot_settings (no userId)
- Admin-only authentication for /admin
- Chat history tracked by session
- Analytics for usage metrics

### Verification

After running migrations, verify:

```sql
-- Check bot_settings is singleton
SELECT COUNT(*) as active_settings
FROM bot_settings
WHERE is_active = true;
-- Should return: 1

-- Check all chats have sessionId
SELECT COUNT(*) as chats_without_session
FROM "Chat"
WHERE "sessionId" IS NULL;
-- Should return: 0

-- Check analytics table exists
SELECT COUNT(*) FROM chat_analytics;
-- Should return: 0 (empty initially)
```

### Rollback

If you need to revert (not recommended):

```powershell
psql $env:POSTGRES_URL -f .\migrations\rollback.sql
```

**Warning:** Rollback will not restore deleted data. Always backup first!

### Backups

Backups are automatically created in `migrations/backups/` when using the PowerShell script.

Manual backup:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump $env:POSTGRES_URL > "backup_$timestamp.sql"
```

### Troubleshooting

**Error: "psql: command not found"**

- Install PostgreSQL client tools from https://www.postgresql.org/download/windows/

**Error: "relation does not exist"**

- Ensure you're running migrations in the correct order
- Check that your POSTGRES_URL is correct

**Error: "permission denied"**

- Verify your database user has CREATE/ALTER permissions
- Check that you're connected to the correct database

### Legacy Migrations

- **create_bot_settings.sql** - Original multi-tenant bot_settings table (superseded by 001_bot_settings_global.sql)
