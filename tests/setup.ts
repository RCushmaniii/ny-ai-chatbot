import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
process.env.POSTGRES_URL = "postgresql://test:test@localhost:5432/test";
process.env.OPENAI_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_placeholder";
process.env.CLERK_SECRET_KEY = "sk_test_placeholder";
process.env.ADMIN_EMAIL = "test@example.com";
process.env.CRON_SECRET = "test-cron-secret";
