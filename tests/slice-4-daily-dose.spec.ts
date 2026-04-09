import { test, expect } from "@playwright/test";

test.describe("Slice 4: Daily Dose", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  test("dashboard shows Daily Dose card", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("daily dose card links to practice page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
    // The card is a link to /daily/practice
    const card = page.locator('a[href="/daily/practice"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
  });

  test("daily practice page loads with questions", async ({ page }) => {
    await page.goto("/daily/practice");
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });
  });

  test("daily practice page shows question and 4 options", async ({ page }) => {
    await page.goto("/daily/practice");
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("button", { name: /^A\./ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /^B\./ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^C\./ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^D\./ })).toBeVisible();
  });

  test("selecting an option enables confirm button", async ({ page }) => {
    await page.goto("/daily/practice");
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeDisabled({ timeout: 10000 });

    await page.getByRole("button", { name: /^A\./ }).click();
    await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeEnabled({ timeout: 5000 });
  });

  test("submitting an answer shows solution", async ({ page }) => {
    await page.goto("/daily/practice");
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeDisabled({ timeout: 10000 });

    await page.getByRole("button", { name: /^B\./ }).click();
    await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeEnabled({ timeout: 5000 });
    await page.getByRole("button", { name: /Confirm Answer/i }).click();

    await expect(page.getByText(/Correct|Incorrect/i).first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".rounded-xl").filter({ hasText: "Solution" }).first()).toBeVisible();
  });

  test("can navigate to next question", async ({ page }) => {
    await page.goto("/daily/practice");
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });

    // Read current question number dynamically (dose may be in progress from prior tests)
    const progressText = await page.getByText(/Question \d+ of \d+/).textContent();
    const currentNum = parseInt(progressText?.match(/Question (\d+)/)?.[1] ?? "1");
    const totalNum = parseInt(progressText?.match(/of (\d+)/)?.[1] ?? "18");

    // Skip if this is the last question (no Next Question button will appear)
    if (currentNum >= totalNum) {
      test.skip();
      return;
    }

    await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeDisabled({ timeout: 10000 });
    await page.getByRole("button", { name: /^C\./ }).click();
    await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeEnabled({ timeout: 5000 });
    await page.getByRole("button", { name: /Confirm Answer/i }).click();
    await expect(page.getByText(/Correct|Incorrect/i).first()).toBeVisible({ timeout: 25000 });

    await page.getByRole("button", { name: /Next Question/i }).click();
    await expect(page.getByText(new RegExp(`Question ${currentNum + 1} of`))).toBeVisible({ timeout: 10000 });
  });

  test("daily dose shows timer", async ({ page }) => {
    await page.goto("/daily/practice");
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/⏱/)).toBeVisible({ timeout: 10000 });
  });

  test("second visit to daily practice reuses same dose", async ({ page }) => {
    await page.goto("/daily/practice");
    const firstText = await page.getByText(/Question \d+ of \d+/).textContent({ timeout: 20000 });

    await page.goto("/dashboard");
    await page.goto("/daily/practice");
    const secondText = await page.getByText(/Question \d+ of \d+/).textContent({ timeout: 20000 });

    // Total question count should be same (same dose)
    const firstTotal = firstText?.match(/of (\d+)/)?.[1];
    const secondTotal = secondText?.match(/of (\d+)/)?.[1];
    expect(firstTotal).toBe(secondTotal);
  });

  test("unauthenticated user redirected from daily practice", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/daily/practice");
    await page.waitForURL("**/login**", { timeout: 10000 });
    await context.close();
  });
});
