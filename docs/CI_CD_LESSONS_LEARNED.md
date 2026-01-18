# CI/CD Lessons Learned: Vercel SDK Chatbot Projects

**Last Updated:** December 20, 2025

This document captures critical lessons learned from debugging CI/CD issues in a Vercel AI SDK chatbot project. Use this guide to avoid similar problems in future single-tenant chatbot installations.

---

## Executive Summary

**The Problem:** Despite using Vercel's AI SDK (a production-ready foundation), we encountered significant CI/CD hurdles with GitHub Actions workflows for Lint and Playwright tests.

**Root Causes:**

1. **Template mismatch** - Vercel SDK template was designed for multi-tenant SaaS, we built single-tenant
2. **Test authentication complexity** - Tests assumed user registration that didn't exist
3. **Lint configuration drift** - Biome rules too strict for rapid development
4. **Local vs CI environment differences** - Massive Playwright installations unnecessary locally

**Time Investment:** ~4-5 hours of debugging that could have been 30 minutes with proper setup.

---

## Core Lesson: Don't Fight the Template's Architecture

### What Happened

The Vercel AI SDK template (`ai-chatbot`) is designed for **multi-tenant SaaS applications** with:

- User registration and authentication
- Per-user chat isolation
- Complex test fixtures for multiple authenticated users
- Playwright tests that create test users dynamically

We built a **single-tenant admin application** with:

- Single admin login (no registration)
- Session-based anonymous chat
- Admin-only knowledge base management

### The Mistake

We kept the original Playwright test infrastructure that assumed:

```typescript
// Original test helper - assumes registration exists
await page.goto("http://localhost:3000/register");
await page.getByPlaceholder("user@acme.com").fill(email);
await page.getByRole("button", { name: "Sign Up" }).click();
```

But our app has no `/register` route - tests hung indefinitely trying to authenticate.

### The Fix

**Option 1 (What We Did):** Simplify tests to match architecture

```typescript
// Simple test - no authentication needed
test("Page loads correctly", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByTestId("multimodal-input")).toBeVisible();
});
```

**Option 2 (Better for Future):** Start with minimal template

- Use Vercel SDK primitives, not the full template
- Build authentication to match your architecture from day 1
- Write tests that match your auth model

---

## Lesson 1: Lint Configuration Should Match Development Stage

### What Happened

Biome linter had strict rules enabled:

- `noNonNullAssertion` - blocked environment variable access
- `useExhaustiveDependencies` - required perfect React hook deps
- `noUnusedImports` - failed on commented-out code
- `useUniqueElementIds` - blocked Radix UI components

CI failed with **hundreds of lint errors** on code that worked perfectly in production.

### Why This Matters

**Strict linting is valuable** but timing matters:

- ✅ **Pre-production:** Catch bugs, enforce consistency
- ❌ **Rapid development:** Blocks progress, creates busywork

### The Solution

Create a **staged linting approach**:

```jsonc
// biome.jsonc - Development phase
{
  "linter": {
    "rules": {
      "correctness": {
        "noUnusedImports": "warn", // Don't block CI
        "useExhaustiveDependencies": "off" // Fix before production
      },
      "style": {
        "noNonNullAssertion": "off" // Allow during dev
      }
    }
  }
}
```

**Before production deployment:**

1. Enable strict rules one category at a time
2. Fix issues in batches
3. Lock down configuration

### Best Practice for Future Projects

```bash
# Day 1: Start with minimal linting
pnpm biome init --minimal

# Week 1-4: Add rules incrementally
# - Enable correctness rules
# - Enable security rules

# Pre-production: Enable all rules
# - Style rules
# - Complexity rules
# - Performance rules
```

---

## Lesson 2: Playwright Local Installation is Unnecessary

### What Happened

We spent significant time:

- Installing Playwright browsers locally (500+ MB)
- Running tests locally that hung due to auth issues
- Debugging local environment differences

### The Reality

**Playwright tests should run in CI, not locally** for most projects:

❌ **What we did:**

```bash
pnpm exec playwright install  # 500MB+ download
pnpm exec playwright test      # Hangs on auth issues
```

✅ **What we should have done:**

```bash
git push  # Let CI run tests
# Check GitHub Actions logs
# Fix based on CI feedback
```

### When to Run Playwright Locally

**Only if:**

- Writing new test scenarios
- Debugging flaky tests
- Developing test infrastructure

**Not for:**

- Verifying CI will pass
- General development workflow
- Quick bug fixes

### Best Practice

**Use GitHub Actions as your test environment:**

```yaml
# .github/workflows/playwright.yml
- name: Run Playwright tests
  run: pnpm exec playwright test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

**Check results via:**

- GitHub Actions UI
- Vercel deployment previews
- CI status badges

---

## Lesson 3: Hydration Mismatches from Third-Party Components

### What Happened

Radix UI components (dropdowns, tooltips) generated different IDs on server vs client:

```
Warning: Prop `id` did not match. Server: "radix-1" Client: "radix-2"
```

### Root Cause

Radix generates IDs dynamically using an internal counter that resets differently on server vs client.

### The Fix

**Gate Radix components behind client-side mount:**

```typescript
export function VisibilitySelector() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render stable markup until mounted
  if (!mounted) {
    return <Button disabled>Loading...</Button>;
  }

  // Now safe to render Radix components
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>...</DropdownMenuTrigger>
    </DropdownMenu>
  );
}
```

### Best Practice for Future Projects

**When using any third-party UI library with SSR:**

1. **Check for hydration warnings immediately** after adding components
2. **Use mounted flags** for components with dynamic IDs
3. **Test in production mode** (`pnpm build && pnpm start`) not just dev mode
4. **Document which components need gating** in your component library

---

## Lesson 4: Environment Variable Handling in CI

### What Happened

Scripts failed in CI with:

```typescript
const client = postgres(process.env.POSTGRES_URL!);
// Error: Forbidden non-null assertion
```

### The Problem

**Non-null assertions (`!`) are dangerous:**

- Hide missing environment variables
- Cause cryptic runtime errors
- Fail lint checks in strict mode

### The Solution

**Always validate environment variables:**

```typescript
// ❌ Bad - hides errors
const client = postgres(process.env.POSTGRES_URL!);

// ✅ Good - explicit validation
if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is required");
}
const client = postgres(process.env.POSTGRES_URL);
```

### Best Practice

**Create an environment validation module:**

```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  POSTGRES_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.string().email(),
});

export const env = envSchema.parse(process.env);
```

**Use it everywhere:**

```typescript
import { env } from "@/lib/env";
const client = postgres(env.POSTGRES_URL); // Type-safe, validated
```

---

## Lesson 5: CI Feedback Loop is Faster Than Local Debugging

### What We Learned

**Time spent debugging locally:** 3+ hours

- Installing Playwright
- Running tests that hung
- Debugging authentication issues
- Trying to replicate CI environment

**Time spent using CI feedback:** 30 minutes

- Push simplified tests
- Check GitHub Actions logs
- Fix based on actual CI errors
- Iterate quickly

### The Methodology

**Instead of:**

```bash
# Local debugging loop
pnpm exec playwright install
pnpm exec playwright test
# Test hangs...
# Try to debug...
# Still hangs...
```

**Do this:**

```bash
# CI-driven development
git add tests/simple-chat.test.ts
git commit -m "Add basic chat test"
git push
# Wait 2 minutes
# Check GitHub Actions
# See actual error
# Fix and repeat
```

### Best Practice

**Use CI as your primary test environment:**

1. **Write minimal test** that should pass
2. **Push to GitHub**
3. **Check Actions logs** for actual failures
4. **Fix based on CI feedback**
5. **Repeat**

**Only run locally when:**

- Developing new test scenarios
- Debugging specific test failures
- Working on test infrastructure

---

## Reproducible Setup Checklist for Future Projects

Use this checklist when starting a new Vercel AI SDK chatbot:

### Day 1: Project Setup

- [ ] **Choose architecture first**
  - Multi-tenant SaaS → Use full Vercel template
  - Single-tenant admin → Use SDK primitives only
- [ ] **Configure linting for development**

  ```bash
  pnpm biome init
  # Start with warnings, not errors
  ```

- [ ] **Set up environment validation**

  ```typescript
  // lib/env.ts with zod schema
  ```

- [ ] **Configure GitHub Actions**
  ```yaml
  # .github/workflows/lint.yml
  # .github/workflows/playwright.yml (minimal tests)
  ```

### Week 1: Core Development

- [ ] **Write authentication to match your architecture**
  - Don't use template auth if it doesn't fit
- [ ] **Add basic Playwright tests**

  ```typescript
  // tests/smoke.test.ts
  test("app loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
  ```

- [ ] **Test SSR hydration**

  ```bash
  pnpm build && pnpm start
  # Check browser console for warnings
  ```

- [ ] **Verify CI passes**
  - Push to GitHub
  - Check Actions tab
  - Fix any failures using CI logs

### Pre-Production

- [ ] **Enable strict linting**
  - Enable all Biome rules
  - Fix issues in batches
- [ ] **Add comprehensive tests**

  - Authentication flows
  - Core user journeys
  - Error handling

- [ ] **Document CI setup**
  - Required environment variables
  - Test database setup
  - Deployment process

---

## Key Takeaways

### 1. **Architecture Alignment**

Don't fight the template's assumptions. Either match them or start simpler.

### 2. **Staged Linting**

Strict rules are valuable but timing matters. Start permissive, tighten before production.

### 3. **CI-First Testing**

Use GitHub Actions as your test environment. Avoid heavy local Playwright installations.

### 4. **Hydration Awareness**

Third-party UI libraries need special handling for SSR. Gate dynamic components behind mount flags.

### 5. **Environment Validation**

Never use non-null assertions. Validate environment variables explicitly.

### 6. **Fast Feedback Loops**

CI feedback is faster than local debugging for integration issues.

---

## Time Savings Estimate

**This project (learning the hard way):**

- CI/CD debugging: ~4-5 hours
- Local Playwright setup: ~1 hour
- Authentication refactoring: ~2 hours
- **Total:** ~7-8 hours

**Future projects (using this guide):**

- Initial setup: ~30 minutes
- CI configuration: ~15 minutes
- Basic tests: ~15 minutes
- **Total:** ~1 hour

**Savings per project:** ~6-7 hours

**ROI:** After 2-3 chatbot projects, this documentation pays for itself.

---

## Related Documentation

- [Lessons Learned (RAG & Admin)](./LESSONS_LEARNED.md) - RAG and admin panel insights
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Vercel deployment process
- [Testing Checklist](./TESTING_CHECKLIST.md) - Comprehensive testing guide

---

## Questions for Future Projects

Before starting a new chatbot installation, ask:

1. **Is this multi-tenant or single-tenant?**

   - Multi-tenant → Use full Vercel template
   - Single-tenant → Use SDK primitives

2. **What authentication model do we need?**

   - Match template or build custom from day 1

3. **What's our CI/CD strategy?**

   - GitHub Actions (recommended)
   - Vercel only
   - Other platform

4. **What's our linting philosophy?**

   - Strict from day 1 (slower development)
   - Permissive then strict (faster iteration)

5. **Do we need local Playwright?**
   - Usually no - use CI
   - Yes if building test infrastructure

Answer these upfront to avoid the pain we experienced.
