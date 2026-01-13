import { describe, expect, it } from "vitest";
import { isOriginAllowed } from "@/lib/security/cors";

describe("CORS", () => {
  describe("isOriginAllowed", () => {
    it("should allow nyenglishteacher.com", () => {
      expect(isOriginAllowed("https://www.nyenglishteacher.com")).toBe(true);
      expect(isOriginAllowed("https://nyenglishteacher.com")).toBe(true);
    });

    it("should allow ny-eng.vercel.app", () => {
      expect(isOriginAllowed("https://ny-eng.vercel.app")).toBe(true);
    });

    it("should allow chat subdomain", () => {
      expect(isOriginAllowed("https://chat.nyenglishteacher.com")).toBe(true);
    });

    it("should reject unknown origins", () => {
      expect(isOriginAllowed("https://malicious-site.com")).toBe(false);
      expect(isOriginAllowed("https://example.com")).toBe(false);
    });

    it("should reject null origin", () => {
      expect(isOriginAllowed(null)).toBe(false);
    });

    it("should reject empty string origin", () => {
      expect(isOriginAllowed("")).toBe(false);
    });

    it("should be case-sensitive for origins", () => {
      expect(isOriginAllowed("https://WWW.NYENGLISHTEACHER.COM")).toBe(false);
    });
  });
});
