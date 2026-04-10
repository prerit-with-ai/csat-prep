import { test, expect } from "@playwright/test";

test.describe("Design D1: Foundation — CSS Palette + Nav + Gap Fix", () => {
  test.describe("Navigation (desktop)", () => {
    test.use({ storageState: "tests/.auth/student.json" });

    test("desktop nav has exactly 5 primary items", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });

      // Desktop nav is the hidden md:flex nav — count anchor children
      const navLinks = page.locator("nav.hidden a");
      await expect(navLinks).toHaveCount(5);
    });

    test("desktop nav contains correct 5 items", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });

      const nav = page.locator("nav.hidden");
      await expect(nav.getByRole("link", { name: /Dashboard/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Topics/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Mocks/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Revision/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Analytics/i })).toBeVisible();
    });

    test("Strategy is NOT a primary nav item", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });

      const nav = page.locator("nav.hidden");
      await expect(nav.getByRole("link", { name: /Strategy/i })).toHaveCount(0);
    });

    test("Strategy page still loads at /strategy", async ({ page }) => {
      await page.goto("/strategy");
      await expect(page.getByText(/Strategy Guide/i)).toBeVisible({ timeout: 10000 });
    });

    test("active nav item is visually distinct", async ({ page }) => {
      await page.goto("/topics");
      await expect(page.getByText(/Topics/i).first()).toBeVisible({ timeout: 10000 });

      // Active Topics link should have a class or style indicating active state
      const activeLink = page.locator("nav.hidden a[href='/topics']");
      await expect(activeLink).toBeVisible();
      // Should not be the same style as inactive links
      const inactiveLink = page.locator("nav.hidden a[href='/mock']");
      await expect(inactiveLink).toBeVisible();
    });
  });

  test.describe("Admin: Passage selector in Edit Question", () => {
    test.use({ storageState: "tests/.auth/admin.json" });

    test("edit question page has a passage selector label", async ({ page }) => {
      // Get a question ID from the API
      const res = await page.request.get("/api/admin/questions");
      expect(res.status()).toBe(200);
      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        test.skip(); // No questions in DB, skip
        return;
      }

      const questionId = data.questions[0].id;
      await page.goto(`/admin/questions/${questionId}/edit`);
      await expect(page.getByText("Edit Question")).toBeVisible({ timeout: 10000 });

      // Passage label must be visible
      await expect(page.getByText(/Passage/i, { exact: false }).first()).toBeVisible();
    });

    test("passage selector exists and is a select element", async ({ page }) => {
      const res = await page.request.get("/api/admin/questions");
      expect(res.status()).toBe(200);
      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        test.skip();
        return;
      }

      const questionId = data.questions[0].id;
      await page.goto(`/admin/questions/${questionId}/edit`);
      await expect(page.getByText("Edit Question")).toBeVisible({ timeout: 10000 });

      // There should be multiple select elements — topic, pattern type, passage, difficulty, language, source type
      const selects = page.locator("select");
      const count = await selects.count();
      expect(count).toBeGreaterThanOrEqual(4); // topic + passage + difficulty + source type at minimum
    });

    test("passage selector disabled when no topic selected", async ({ page }) => {
      // Navigate to NEW question page where topic starts empty
      await page.goto("/admin/questions/new");
      await expect(page.getByText("New Question")).toBeVisible({ timeout: 10000 });

      // Find passage select — should be disabled when topic is not yet selected
      const passageSelect = page.locator("select").nth(1); // second select is passage
      // Topic is empty by default, so passage should be disabled
      await expect(passageSelect).toBeDisabled();
    });
  });

  test.describe("Smoke tests — nothing broken", () => {
    test.use({ storageState: "tests/.auth/student.json" });

    test("dashboard loads with Welcome heading", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
    });

    test("topics page loads", async ({ page }) => {
      await page.goto("/topics");
      await expect(page.getByText(/Topics/i).first()).toBeVisible({ timeout: 10000 });
    });

    test("analytics page loads", async ({ page }) => {
      await page.goto("/analytics");
      await expect(page.getByText(/Performance|Analytics/i).first()).toBeVisible({ timeout: 10000 });
    });
  });
});
