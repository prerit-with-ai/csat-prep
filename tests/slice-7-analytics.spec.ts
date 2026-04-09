import { test, expect } from "@playwright/test";

test.describe("Slice 7: Analytics + Polish", () => {
  test.describe("Student-facing", () => {
    test.use({ storageState: "tests/.auth/student.json" });

    test("strategy page loads and shows key sections", async ({ page }) => {
      await page.goto("/strategy");
      await expect(page.getByText(/Strategy Guide/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/ABC Method/i)).toBeVisible();
      await expect(page.getByText(/Scoring/i)).toBeVisible();
    });

    test("strategy page shows qualifying score info", async ({ page }) => {
      await page.goto("/strategy");
      await expect(page.getByText(/66/).first()).toBeVisible({ timeout: 10000 });
    });

    test("strategy page is accessible to authenticated student", async ({ page }) => {
      const res = await page.request.get("/strategy");
      expect(res.status()).toBe(200);
    });

    test("GET /api/formulas returns correct structure", async ({ page }) => {
      const res = await page.request.get("/api/formulas");
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.topics)).toBe(true);

      // If there are topics with formula cards, verify structure
      if (data.topics.length > 0) {
        const topic = data.topics[0];
        expect(topic).toHaveProperty("topicId");
        expect(topic).toHaveProperty("topicName");
        expect(topic).toHaveProperty("topicSection");
        expect(Array.isArray(topic.cards)).toBe(true);
      }
    });

    test("GET /api/progress/abc-trend returns correct structure", async ({ page }) => {
      const res = await page.request.get("/api/progress/abc-trend");
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.mocks)).toBe(true);

      if (data.mocks.length > 0) {
        const mock = data.mocks[0];
        expect(mock).toHaveProperty("id");
        expect(mock).toHaveProperty("aCount");
        expect(mock).toHaveProperty("bCount");
        expect(mock).toHaveProperty("cCount");
        expect(mock).toHaveProperty("netScore");
      }
    });

    test("formula FAB renders on dashboard (formula cards exist check)", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page.getByText(/Welcome/i)).toBeVisible({ timeout: 10000 });
      // FAB only shows when formula cards exist — API check
      const res = await page.request.get("/api/formulas");
      const data = await res.json();
      if (data.topics.length > 0) {
        // FAB button should be visible
        await expect(page.getByText(/∑/)).toBeVisible({ timeout: 5000 });
      }
      // Either way, page loads without error
    });

    test("unauthenticated user redirected from strategy page", async ({ browser }) => {
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      const page = await context.newPage();
      await page.goto("/strategy");
      await page.waitForURL("**/login**", { timeout: 10000 });
      await context.close();
    });

    test("unauthenticated user cannot access formulas API", async ({ browser }) => {
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      const page = await context.newPage();
      const res = await page.request.get("/api/formulas");
      expect(res.status()).toBe(401);
      await context.close();
    });

    test("unauthenticated user cannot access abc-trend API", async ({ browser }) => {
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      const page = await context.newPage();
      const res = await page.request.get("/api/progress/abc-trend");
      expect(res.status()).toBe(401);
      await context.close();
    });
  });

  test.describe("Admin-facing", () => {
    test.use({ storageState: "tests/.auth/admin.json" });

    test("GET /api/admin/analytics returns correct structure", async ({ page }) => {
      const res = await page.request.get("/api/admin/analytics");
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.topicStats)).toBe(true);
      expect(Array.isArray(data.patternWeaknesses)).toBe(true);
      expect(data.overallStats).toHaveProperty("totalStudents");
    });

    test("analytics page loads", async ({ page }) => {
      await page.goto("/admin/analytics");
      await expect(page.getByText(/Analytics/i)).toBeVisible({ timeout: 10000 });
    });

    test("GET /api/admin/flags returns correct structure", async ({ page }) => {
      const res = await page.request.get("/api/admin/flags");
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.needsHelpFlags)).toBe(true);
      expect(Array.isArray(data.persistentItems)).toBe(true);
    });

    test("flags page loads", async ({ page }) => {
      await page.goto("/admin/flags");
      await expect(
        page.getByText(/Flags/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("student cannot access admin analytics", async ({ browser }) => {
      const studentContext = await browser.newContext({
        storageState: "tests/.auth/student.json",
      });
      const page = await studentContext.newPage();
      const res = await page.request.get("/api/admin/analytics");
      expect(res.status()).toBe(403);
      await studentContext.close();
    });

    test("student cannot access admin flags API", async ({ browser }) => {
      const studentContext = await browser.newContext({
        storageState: "tests/.auth/student.json",
      });
      const page = await studentContext.newPage();
      const res = await page.request.get("/api/admin/flags");
      expect(res.status()).toBe(403);
      await studentContext.close();
    });

    test("admin dashboard shows Analytics and Flags nav cards", async ({ page }) => {
      await page.goto("/admin");
      await expect(page.getByText(/Analytics/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/Flags/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
