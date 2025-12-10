# Admin Setup Guide - Single-Tenant Chatbot

## Overview

This chatbot is now **single-tenant** which means:

- ✅ **Anonymous users** can chat without logging in
- ✅ **One admin user** (you) can access `/admin` dashboard
- ❌ **No public registration** - only you can create admin accounts

---

## Creating Your Admin Account

### Option 1: Using the Script (Recommended)

```powershell
# Set your admin credentials in .env.local
ADMIN_EMAIL="your-email@example.com"
ADMIN_PASSWORD="your-secure-password"

# Run the script
pnpm run create-admin
```

The script will:

- Check if admin user already exists
- Create new admin user if needed
- Show your login credentials

### Option 2: Manual Database Insert

If you prefer, you can create an admin user directly in the database:

```sql
-- Replace with your email and hashed password
INSERT INTO "User" (id, email, password)
VALUES (
  gen_random_uuid(),
  'your-email@example.com',
  'hashed-password-here'
);
```

---

## Logging In

1. Go to http://localhost:3000/login (or your production URL)
2. Enter your admin email and password
3. You'll be redirected to the chat interface
4. Access admin dashboard at http://localhost:3000/admin

---

## Admin vs Anonymous Users

### Admin Users (You)

- ✅ Can login via `/login`
- ✅ Can access `/admin` dashboard
- ✅ Can manage knowledge base
- ✅ Can update bot settings
- ✅ Can use document tools (createDocument, updateDocument)
- ✅ Chats are saved with both `userId` and `sessionId`

### Anonymous Users (Everyone Else)

- ✅ Can chat without logging in
- ✅ Sessions tracked via cookies
- ✅ Chat history persists across refreshes
- ✅ Rate limited by session
- ❌ Cannot access `/admin`
- ❌ Cannot use document tools
- ✅ Chats are saved with `sessionId` only

---

## Environment Variables

Make sure these are set in your `.env.local`:

```bash
# Admin email (used for dashboard access check)
ADMIN_EMAIL="your-email@example.com"

# Optional: Default password for create-admin script
ADMIN_PASSWORD="your-secure-password"

# Database
POSTGRES_URL="postgresql://..."

# Auth
AUTH_SECRET="your-secret-key"

# OpenAI
OPENAI_API_KEY="sk-..."
```

---

## Security Notes

### Admin Access Control

The admin dashboard checks if the logged-in user's email matches `ADMIN_EMAIL`:

```typescript
// app/(chat)/admin/page.tsx
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "your-email@example.com";

if (session.user.email !== ADMIN_EMAIL) {
  redirect("/");
}
```

### Best Practices

1. **Use a strong password** - At least 12 characters
2. **Change default password** - If using the script's default
3. **Keep ADMIN_EMAIL secret** - Don't commit to git
4. **Use environment variables** - Never hardcode credentials
5. **Enable 2FA** - Consider adding 2FA in the future

---

## Troubleshooting

### "Cannot access /admin"

- Verify you're logged in
- Check that your email matches `ADMIN_EMAIL` in `.env.local`
- Clear cookies and login again

### "User already exists"

- Admin user was already created
- Use existing credentials to login
- Or delete the user from database and recreate

### "Failed to create user"

- Check database connection (`POSTGRES_URL`)
- Verify database is accessible
- Check for database errors in console

---

## Adding More Admin Users (Optional)

If you want multiple admin users in the future:

1. Run the create-admin script with different email
2. Update the admin check to allow multiple emails:

```typescript
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  "second-admin@example.com",
  "third-admin@example.com",
];

if (!ADMIN_EMAILS.includes(session.user.email)) {
  redirect("/");
}
```

---

## Migration from Multi-Tenant

If you had users before the migration:

- ✅ All existing users are preserved in database
- ✅ Their chats now have `sessionId` assigned
- ✅ Old users can still login
- ⚠️ Only users matching `ADMIN_EMAIL` can access `/admin`

---

**Questions?** Check the main README.md or CODE_CHANGES_SUMMARY.md
