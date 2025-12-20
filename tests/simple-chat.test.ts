import { expect, test } from "@playwright/test";

test("Basic chat functionality", async ({ page }) => {
  // Go to the chat page
  await page.goto("/");

  // Check that the page loads
  await expect(page.locator("body")).toBeVisible();

  // Check that the input field exists
  const input = page.getByTestId("multimodal-input");
  await expect(input).toBeVisible();

  // Send a simple message
  await input.click();
  await input.fill("Hello");

  // Check send button exists and click it
  const sendButton = page.getByTestId("send-button");
  await expect(sendButton).toBeVisible();
  await sendButton.click();

  // Wait for response (basic check)
  await page.waitForTimeout(2000);

  // Check that some content appeared (message exchange)
  const messages = page.locator('[data-testid*="message-"]');
  await expect(messages).toHaveCount(2); // User message + assistant response
});

test("Page loads correctly", async ({ page }) => {
  await page.goto("/");

  // Check basic page elements
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByTestId("multimodal-input")).toBeVisible();
  await expect(page.getByTestId("send-button")).toBeVisible();
});
