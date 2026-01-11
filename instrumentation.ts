import { registerOTel } from "@vercel/otel";
import { validateEnvOrThrow } from "@/lib/env-validation";

export function register() {
  // Validate environment variables at startup
  validateEnvOrThrow();

  // Register OpenTelemetry
  registerOTel({ serviceName: "ny-ai-chatbot" });
}
