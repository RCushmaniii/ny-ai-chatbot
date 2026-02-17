import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEnvSummary, validateEnv } from "@/lib/env-validation";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env to clean state
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should pass when all required variables are set", () => {
    process.env.POSTGRES_URL = "postgresql://test";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_xxx";
    process.env.CLERK_SECRET_KEY = "sk_test_xxx";
    process.env.ADMIN_EMAIL = "test@example.com";
    process.env.CRON_SECRET = "test-secret";

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("should fail when POSTGRES_URL is missing", () => {
    delete process.env.POSTGRES_URL;
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_xxx";
    process.env.CLERK_SECRET_KEY = "sk_test_xxx";
    process.env.ADMIN_EMAIL = "test@example.com";
    process.env.CRON_SECRET = "test-secret";

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.some((m) => m.includes("POSTGRES_URL"))).toBe(true);
  });

  it("should fail when OPENAI_API_KEY is missing", () => {
    process.env.POSTGRES_URL = "postgresql://test";
    delete process.env.OPENAI_API_KEY;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_xxx";
    process.env.CLERK_SECRET_KEY = "sk_test_xxx";
    process.env.ADMIN_EMAIL = "test@example.com";
    process.env.CRON_SECRET = "test-secret";

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.some((m) => m.includes("OPENAI_API_KEY"))).toBe(true);
  });

  it("should fail when CLERK_SECRET_KEY is missing", () => {
    process.env.POSTGRES_URL = "postgresql://test";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_xxx";
    delete process.env.CLERK_SECRET_KEY;
    process.env.ADMIN_EMAIL = "test@example.com";
    process.env.CRON_SECRET = "test-secret";

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.some((m) => m.includes("CLERK_SECRET_KEY"))).toBe(
      true,
    );
  });

  it("should warn about missing optional variables", () => {
    process.env.POSTGRES_URL = "postgresql://test";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_xxx";
    process.env.CLERK_SECRET_KEY = "sk_test_xxx";
    process.env.ADMIN_EMAIL = "test@example.com";
    process.env.CRON_SECRET = "test-secret";
    delete process.env.REDIS_URL;

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("getEnvSummary", () => {
  it("should return boolean flags for env vars", () => {
    process.env.POSTGRES_URL = "test";
    process.env.OPENAI_API_KEY = "test";

    const summary = getEnvSummary();
    expect(typeof summary.POSTGRES_URL).toBe("boolean");
    expect(typeof summary.OPENAI_API_KEY).toBe("boolean");
  });
});
