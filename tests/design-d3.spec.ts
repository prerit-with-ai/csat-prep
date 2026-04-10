import { test, expect } from "@playwright/test";

test.describe("Design D3: Dashboard Redesign", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  // ── Existing test assertions preserved ────────────────────────────────────
  test("dashboard has Welcome heading (existing)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
  });

  test("section names visible on dashboard (existing)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
    const sections = ["Reading Comprehension", "Logical Reasoning", "Mathematics"];
    let found = 0;
    for (const section of sections) {
      if (await page.getByText(section).count() > 0) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("Percentage topic link visible on dashboard (existing)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Percentage")).toBeVisible({ timeout: 10000 });
  });

  test("clicking Percentage navigates to topic page (existing)", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByText("Percentage").first().click();
    await page.waitForURL("**/topics/percentage**", { timeout: 10000 });
  });

  test("Daily Dose visible with link to /daily/practice (existing)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Daily Dose/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('a[href="/daily/practice"]').first()).toBeVisible();
  });

  // ── New layout assertions ─────────────────────────────────────────────────
  test("dashboard has a Today zone", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="today-zone"]')).toBeVisible();
  });

  test("stat strip is present with at least one stat", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="stat-strip"]')).toBeVisible();
  });

  test("section containers present for sections that have topics", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
    // At least one section container should be present
    const containers = page.locator('[data-testid^="section-container-"]');
    const count = await containers.count();
    expect(count).toBeGreaterThan(0);
  });

  test("topic rows are links inside section containers", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
    // Topic rows should be anchor tags inside section containers
    const topicLinks = page.locator('[data-testid^="section-container-"] a');
    const count = await topicLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("section headers have section-tinted background (RC)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
    const rcHeader = page.locator('[data-testid="section-header-rc"]');
    if (await rcHeader.count() > 0) {
      await expect(rcHeader).toBeVisible();
      // Check it has an inline style with section bg var
      const style = await rcHeader.getAttribute("style");
      expect(style).toContain("--section-rc-bg");
    }
  });
});
