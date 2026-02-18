import { expect, test } from "../fixtures";
import { ChatPage } from "../pages/chat";

test.describe("Anonymous Session", () => {
  test("Load chat page without sign-in", async ({ page }) => {
    const response = await page.goto("/");

    if (!response) {
      throw new Error("Failed to load page");
    }

    // Anonymous users load directly — no auth redirect chain
    await page.waitForURL("/");
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("Chat interface is visible for anonymous users", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("multimodal-input")).toBeVisible({
      timeout: 15000,
    });
  });

  test("Sign in link is visible for anonymous users", async ({ page }) => {
    await page.goto("/");
    const signInLink = page.getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible({ timeout: 15000 });
    await expect(signInLink).toHaveAttribute("href", "/sign-in");
  });
});

test.describe("Protected Routes", () => {
  test("Admin page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin");
    // Clerk middleware should redirect to sign-in
    await page.waitForURL(/sign-in/, { timeout: 10000 });
  });

  test("Sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForURL(/sign-in/);
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("Entitlements", () => {
  let chatPage: ChatPage;

  test.beforeEach(({ page }) => {
    chatPage = new ChatPage(page);
  });

  test("Anonymous user cannot send more than 20 messages/day", async () => {
    test.fixme();
    await chatPage.createNewChat();

    for (let i = 0; i <= 20; i++) {
      await chatPage.sendUserMessage("Why is the sky blue?");
      await chatPage.isGenerationComplete();
    }

    await chatPage.sendUserMessage("Why is the sky blue?");
  });
});
