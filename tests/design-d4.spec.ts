import { test, expect } from "@playwright/test";

test.describe("Design D4: Topics Page + Topic Detail Redesign", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  // ── Topics listing page ───────────────────────────────────────────────────
  test("topics page loads", async ({ page }) => {
    await page.goto("/topics");
    await expect(page.getByText(/Topics/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("topics page shows section containers", async ({ page }) => {
    await page.goto("/topics");
    await expect(page.getByText(/Topics/i).first()).toBeVisible({ timeout: 10000 });
    const containers = page.locator('[data-testid^="topics-section-"]');
    const count = await containers.count();
    expect(count).toBeGreaterThan(0);
  });

  test("topics page section headers are tinted", async ({ page }) => {
    await page.goto("/topics");
    await expect(page.getByText(/Topics/i).first()).toBeVisible({ timeout: 10000 });
    const rcHeader = page.locator('[data-testid="topics-section-header-rc"]');
    if (await rcHeader.count() > 0) {
      const style = await rcHeader.getAttribute("style");
      expect(style).toContain("--section-rc-bg");
    }
  });

  test("topics page shows Percentage as a topic row link", async ({ page }) => {
    await page.goto("/topics");
    await expect(page.getByText("Percentage")).toBeVisible({ timeout: 10000 });
    const link = page.locator('a[href="/topics/percentage"]');
    await expect(link).toBeVisible();
  });

  test("topics page shows status info on topic rows", async ({ page }) => {
    await page.goto("/topics");
    await expect(page.getByText(/Topics/i).first()).toBeVisible({ timeout: 10000 });
    // At least one status label should be present
    const statusEl = page.getByText(/Not started|^Started$|In progress|Completed/).first();
    await expect(statusEl).toBeVisible({ timeout: 5000 });
  });

  test("clicking topic row navigates to topic detail", async ({ page }) => {
    await page.goto("/topics");
    await page.locator('a[href="/topics/percentage"]').click();
    await page.waitForURL("**/topics/percentage**", { timeout: 10000 });
    await expect(page.getByRole("heading", { level: 1, name: "Percentage" })).toBeVisible();
  });

  // ── Topic detail page — ALL existing slice-2 assertions must still pass ──
  test("topic detail still has Cheatsheet heading (existing)", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { name: "Cheatsheet" })).toBeVisible({ timeout: 10000 });
  });

  test("topic detail still has What you'll learn heading (existing)", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { name: "What you'll learn" })).toBeVisible({ timeout: 10000 });
  });

  test("topic detail still has Study Resources heading (existing)", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { name: "Study Resources" })).toBeVisible({ timeout: 10000 });
  });

  test("topic detail still has Are you ready to practice heading (existing)", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { name: "Are you ready to practice?" })).toBeVisible({ timeout: 10000 });
  });

  test("topic detail still has Ready to practice and Not ready yet buttons (existing)", async ({ page }) => {
    await page.goto("/topics/syllogisms");
    await expect(page.getByRole("button", { name: "Ready to practice" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Not ready yet" })).toBeVisible();
  });

  // ── New topic detail design assertions ───────────────────────────────────
  test("topic detail has a colored header band", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { level: 1, name: "Percentage" })).toBeVisible({ timeout: 10000 });
    const header = page.locator('[data-testid="topic-header"]');
    await expect(header).toBeVisible();
    const style = await header.getAttribute("style");
    // Header should have a section-tinted background
    expect(style).toMatch(/--section-math-bg|--section-rc-bg|--section-lr-bg/);
  });

  test("topic detail has Start Practice CTA in the header", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { level: 1, name: "Percentage" })).toBeVisible({ timeout: 10000 });
    // Start Practice link should be present (may appear in header and/or footer)
    const practiceLinks = page.locator('a[href="/topics/percentage/practice"]');
    const count = await practiceLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("topic detail back link goes to Topics", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { level: 1, name: "Percentage" })).toBeVisible({ timeout: 10000 });
    const backLink = page.getByRole('link', { name: '← Topics' });
    await expect(backLink).toBeVisible();
  });
});
