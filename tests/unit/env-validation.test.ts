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
    process.env.AUTH_SECRET = "secret";

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("should fail when POSTGRES_URL is missing", () => {
    delete process.env.POSTGRES_URL;
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.AUTH_SECRET = "secret";

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.some((m) => m.includes("POSTGRES_URL"))).toBe(true);
  });

  it("should fail when OPENAI_API_KEY is missing", () => {
    process.env.POSTGRES_URL = "postgresql://test";
    delete process.env.OPENAI_API_KEY;
    process.env.AUTH_SECRET = "secret";

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.some((m) => m.includes("OPENAI_API_KEY"))).toBe(true);
  });

  it("should fail when AUTH_SECRET is missing", () => {
    process.env.POSTGRES_URL = "postgresql://test";
    process.env.OPENAI_API_KEY = "sk-test";
    delete process.env.AUTH_SECRET;

    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.some((m) => m.includes("AUTH_SECRET"))).toBe(true);
  });

  it("should warn about missing optional variables", () => {
    process.env.POSTGRES_URL = "postgresql://test";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.AUTH_SECRET = "secret";
    delete process.env.ADMIN_EMAIL;

    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("ADMIN_EMAIL"))).toBe(true);
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
