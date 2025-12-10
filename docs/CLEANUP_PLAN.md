# Multi-Tenant Code Cleanup Plan

## 🗑️ Items to Remove

### 1. User Registration (Not Needed for Single-Tenant)

- ❌ `app/(auth)/register/page.tsx` - User registration page
- ❌ `register` action in `app/(auth)/actions.ts` - Registration logic
- ⚠️ Keep login for admin access

### 2. Unused Database Queries

- ❌ `getChatsByUserId()` - Replaced by `getChatsBySessionId()`
- ❌ `deleteAllChatsByUserId()` - Not needed for anonymous sessions
- ❌ `getMessageCountByUserId()` - Replaced by `getMessageCountBySessionId()`

### 3. Guest User Creation

- ❌ `createGuestUser()` in queries.ts - No longer needed
- ❌ Guest provider in `auth.ts` - Sessions handle this now

### 4. Deprecated Migrations

- ❌ `migrations/create_bot_settings.sql` - Superseded by new migrations

### 5. Multi-Tenant References in Docs

- ⚠️ Update README.md to remove multi-tenant mentions
- ⚠️ Update PRODUCTION_CHECKLIST.md

---

## ✅ Items to Keep

### Authentication (Admin Only)

- ✅ `app/(auth)/login/page.tsx` - Admin login
- ✅ `app/(auth)/auth.ts` - Auth configuration
- ✅ `signIn` action - Admin authentication

### User Table

- ✅ Keep User table - Used for admin accounts
- ✅ `getUser()` - Used for login
- ✅ `createUser()` - Used for creating admin accounts

### Core Functionality

- ✅ All chat functionality
- ✅ Knowledge base
- ✅ RAG implementation
- ✅ Admin dashboard

---

## 🔧 Cleanup Actions

### Phase 1: Remove Registration

1. Delete `app/(auth)/register/` folder
2. Remove `register` action from `actions.ts`
3. Remove registration links from login page

### Phase 2: Clean Database Queries

1. Remove `getChatsByUserId()` from queries.ts
2. Remove `deleteAllChatsByUserId()` from queries.ts
3. Remove `getMessageCountByUserId()` from queries.ts
4. Remove `createGuestUser()` from queries.ts

### Phase 3: Clean Auth

1. Remove guest provider from auth.ts
2. Keep only Credentials provider for admin

### Phase 4: Remove Old Migrations

1. Delete `migrations/create_bot_settings.sql`

### Phase 5: Update Documentation

1. Update README.md
2. Update PRODUCTION_CHECKLIST.md
3. Add note about single-tenant architecture

---

## ⚠️ Safety Checks

Before removing each item:

- ✅ Verify not imported anywhere
- ✅ Verify not called anywhere
- ✅ Check for TypeScript errors after removal
- ✅ Test that app still works

---

**Status:** Ready to execute  
**Estimated Time:** 10 minutes  
**Risk Level:** Low (all items verified as unused)
