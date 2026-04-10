import { test, expect } from "@playwright/test";

test.describe("Design D5: Mock Analysis Redesign", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  // Helper: get the most recent completed mock analysis URL from the history page
  async function getLatestAnalysisUrl(page: import("@playwright/test").Page): Promise<string | null> {
    await page.goto("/mock/history");
    await page.waitForLoadState("networkidle");
    const link = page.locator('a[href*="/analysis"]').first();
    if (await link.count() === 0) return null;
    const href = await link.getAttribute("href");
    return href;
  }

  // Use this stable wait after navigating to an analysis page
  async function waitForAnalysisPage(page: import("@playwright/test").Page) {
    await expect(page.getByRole("link", { name: "← Back to Dashboard" })).toBeVisible({ timeout: 10000 });
  }

  test("mock history page loads", async ({ page }) => {
    await page.goto("/mock/history");
    await expect(
      page.getByText(/Mock History/i).or(page.getByText(/No completed mocks/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("mock analysis page loads for a completed mock", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
  });

  test("score hero block is present with data-testid", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    const hero = page.locator('[data-testid="score-hero"]');
    await expect(hero).toBeVisible();
  });

  test("score hero shows large score number", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    const scoreNum = page.locator('[data-testid="score-number"]');
    await expect(scoreNum).toBeVisible();
    const fontSize = await scoreNum.evaluate((el) => window.getComputedStyle(el).fontSize);
    const px = parseFloat(fontSize);
    expect(px).toBeGreaterThanOrEqual(48);
  });

  test("score hero has color-coded background based on score threshold", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    const hero = page.locator('[data-testid="score-hero"]');
    const style = await hero.getAttribute("style");
    expect(style).toMatch(/--color-(correct|amber|wrong)-bg/);
  });

  test("score hero shows 'out of 200' label", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    await expect(page.getByText(/out of 200/i)).toBeVisible();
  });

  test("score hero shows correct/wrong/skipped counts", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    await expect(page.getByText(/correct/i).first()).toBeVisible();
    await expect(page.getByText(/wrong/i).first()).toBeVisible();
    await expect(page.getByText(/skipped/i).first()).toBeVisible();
  });

  test("ABC chips block is present with data-testid", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    const chips = page.locator('[data-testid="abc-chips"]');
    await expect(chips).toBeVisible();
  });

  test("ABC chips show A, B, C labels", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    const chips = page.locator('[data-testid="abc-chips"]');
    await expect(chips.getByText("A", { exact: true }).first()).toBeVisible();
    await expect(chips.getByText("B", { exact: true })).toBeVisible();
    await expect(chips.getByText("C", { exact: true })).toBeVisible();
  });

  test("existing section Calibration Report still present", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    await expect(page.getByRole("heading", { name: /Calibration Report/i })).toBeVisible();
  });

  test("existing section Question Review still present", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    await expect(page.getByRole("heading", { name: /Question Review/i })).toBeVisible();
  });

  test("Start Another Mock and Back to Dashboard links present", async ({ page }) => {
    const url = await getLatestAnalysisUrl(page);
    if (!url) { test.skip(); return; }
    await page.goto(url);
    await waitForAnalysisPage(page);
    await expect(page.getByRole("link", { name: /Start Another Mock/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Dashboard", exact: true })).toBeVisible();
  });
});
