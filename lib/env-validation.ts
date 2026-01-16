/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup to fail fast
 * rather than encountering errors at runtime.
 */

type EnvVar = {
  name: string;
  required: boolean;
  description: string;
};

const REQUIRED_ENV_VARS: EnvVar[] = [
  {
    name: "POSTGRES_URL",
    required: true,
    description: "PostgreSQL connection string with pgvector",
  },
  {
    name: "OPENAI_API_KEY",
    required: true,
    description: "OpenAI API key for chat and embeddings",
  },
  {
    name: "AUTH_SECRET",
    required: true,
    description: "NextAuth secret (generate: openssl rand -base64 32)",
  },
];

const OPTIONAL_ENV_VARS: EnvVar[] = [
  {
    name: "ADMIN_EMAIL",
    required: false,
    description: "Admin user email for dashboard access",
  },
  {
    name: "ADMIN_PASSWORD",
    required: false,
    description: "Admin user password",
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: false,
    description: "Public app URL for embed widget",
  },
  {
    name: "ALLOWED_ORIGINS",
    required: false,
    description: "Additional CORS origins (comma-separated)",
  },
  {
    name: "REDIS_URL",
    required: false,
    description: "Redis URL for resumable streams",
  },
  // Upstash Redis for rate limiting
  {
    name: "UPSTASH_REDIS_REST_URL",
    required: false,
    description: "Upstash Redis REST URL for rate limiting",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    required: false,
    description: "Upstash Redis REST token for rate limiting",
  },
  // Sentry error monitoring
  {
    name: "SENTRY_DSN",
    required: false,
    description: "Sentry DSN for error monitoring",
  },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    required: false,
    description: "Sentry DSN for client-side error monitoring",
  },
];

export type ValidationResult = {
  valid: boolean;
  missing: string[];
  warnings: string[];
};

/**
 * Validate that all required environment variables are set
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar.name]) {
      missing.push(`${envVar.name}: ${envVar.description}`);
    }
  }

  // Check optional but recommended variables
  for (const envVar of OPTIONAL_ENV_VARS) {
    if (!process.env[envVar.name]) {
      warnings.push(`${envVar.name}: ${envVar.description}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate environment and throw error if critical variables are missing
 * Call this at application startup
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  if (!result.valid) {
    const errorMessage = [
      "Missing required environment variables:",
      ...result.missing.map((m) => `  - ${m}`),
      "",
      "Please set these in your .env file or Vercel dashboard.",
    ].join("\n");

    throw new Error(errorMessage);
  }

  // Log warnings for missing optional variables (only in development)
  if (result.warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn(
      "[ENV] Missing optional environment variables:",
      result.warnings.map((w) => `\n  - ${w}`).join(""),
    );
  }
}

/**
 * Get environment configuration summary (safe for logging)
 */
export function getEnvSummary(): Record<string, boolean> {
  return {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    REDIS_URL: !!process.env.REDIS_URL,
    ALLOWED_ORIGINS: !!process.env.ALLOWED_ORIGINS,
  };
}
