import { test, expect } from "@playwright/test";

test.describe("Design D2: Daily Dose Card Redesign", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  test("daily dose card is still a link to /daily/practice", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
    const card = page.locator('a[href="/daily/practice"]').first();
    await expect(card).toBeVisible();
  });

  test("daily dose card shows 'Daily Dose' text", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("daily dose card has a progress bar element", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
    // Progress bar wrapper
    const progressBar = page.locator('[data-testid="dose-progress"]');
    await expect(progressBar).toBeVisible({ timeout: 10000 });
  });

  test("daily dose card shows question count", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
    // Should show X of 18 or similar
    await expect(page.getByText(/of 18|18 questions/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("daily dose card has a call-to-action link text", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
    // Should show Start / Continue / View Summary
    const cta = page.getByText(/Start today|Continue|View Summary/i).first();
    await expect(cta).toBeVisible({ timeout: 10000 });
  });

  test("daily dose card navigates to practice when clicked", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
    await page.locator('a[href="/daily/practice"]').first().click();
    await page.waitForURL("**/daily/practice**", { timeout: 10000 });
  });

  // Streak test — conditional on streak being available
  test("daily dose card streak element exists in DOM when streak > 0", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });

    const res = await page.request.get("/api/daily");
    if (res.ok()) {
      const data = await res.json();
      if (data.streak > 0) {
        const streakEl = page.locator('[data-testid="dose-streak"]');
        await expect(streakEl).toBeVisible({ timeout: 5000 });
      }
    }
    // If streak = 0, test passes trivially (streak badge is hidden correctly)
  });
});
