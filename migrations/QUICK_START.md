# 🚀 Quick Start: Run Migrations

## Prerequisites

- PostgreSQL client tools installed (`psql` command available)
- Database connection string (POSTGRES_URL)
- Backup of current database (recommended)

## Option 1: Automated (Recommended)

```powershell
# Set your database URL
$env:POSTGRES_URL = "postgresql://user:pass@host:5432/db"

# Run all migrations with automatic backup
.\migrations\run-migrations.ps1

# Or dry run first to see what will happen
.\migrations\run-migrations.ps1 -DryRun
```

## Option 2: Manual (Vercel Dashboard)

1. Go to Vercel Dashboard → Your Project → Storage → Postgres
2. Click "Query" tab
3. Copy and paste each file in order:
   - `000_enable_extensions.sql`
   - `001_bot_settings_global.sql`
   - `002_chat_sessionid.sql`
   - `003_analytics_table.sql`
   - `004_migrate_existing_chats.sql`
4. Click "Run Query" for each

## Option 3: Command Line

```powershell
# Set database URL
$env:POSTGRES_URL = "your-connection-string"

# Backup first
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump $env:POSTGRES_URL > "backup_$timestamp.sql"

# Run migrations in order
psql $env:POSTGRES_URL -f .\migrations\000_enable_extensions.sql
psql $env:POSTGRES_URL -f .\migrations\001_bot_settings_global.sql
psql $env:POSTGRES_URL -f .\migrations\002_chat_sessionid.sql
psql $env:POSTGRES_URL -f .\migrations\003_analytics_table.sql
psql $env:POSTGRES_URL -f .\migrations\004_migrate_existing_chats.sql
```

## Verify Success

```sql
-- Check bot_settings is singleton (should return 1)
SELECT COUNT(*) FROM bot_settings WHERE is_active = true;

-- Check all chats have sessionId (should return 0)
SELECT COUNT(*) FROM "Chat" WHERE "sessionId" IS NULL;

-- Check analytics table exists (should return 0 initially)
SELECT COUNT(*) FROM chat_analytics;
```

## Troubleshooting

### "psql: command not found"

Install PostgreSQL client: https://www.postgresql.org/download/windows/

### "permission denied"

Verify your database user has CREATE/ALTER permissions

### "relation does not exist"

Ensure you're running migrations in the correct order

## Next Steps

After migrations complete:

1. Update code to use new session management
2. Test anonymous chat functionality
3. Verify admin dashboard works
4. Deploy to production

## Rollback (Emergency Only)

```powershell
# Restore from backup
psql $env:POSTGRES_URL < backup_TIMESTAMP.sql

# Or partial rollback
psql $env:POSTGRES_URL -f .\migrations\rollback.sql
```

**Warning:** Rollback will not restore deleted data!

---

**Need Help?** See `migrations/README.md` for detailed documentation
