import { test, expect } from "@playwright/test";

test.describe("Slice 2: Student Learns", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  test("student dashboard loads and shows topics grouped by section", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();

    // Should show at least one section heading
    const sections = ["Reading Comprehension", "Logical Reasoning", "Mathematics"];
    let found = 0;
    for (const section of sections) {
      const heading = page.getByText(section);
      if (await heading.count() > 0) found++;
    }
    expect(found).toBeGreaterThan(0);
  });

  test("dashboard shows topics as clickable links", async ({ page }) => {
    await page.goto("/dashboard");
    // Percentage topic should be visible (seeded in slice 1)
    await expect(page.getByText("Percentage")).toBeVisible();
  });

  test("student can navigate to a topic page from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // Click the Percentage topic link
    await page.getByText("Percentage").first().click();
    await page.waitForURL("**/topics/percentage**", { timeout: 10000 });
    await expect(page.getByRole("heading", { level: 1, name: "Percentage" })).toBeVisible();
  });

  test("topic page shows cheatsheet section", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { name: "Cheatsheet" })).toBeVisible();
  });

  test("topic page shows pattern types under 'What you'll learn'", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { name: "What you'll learn" })).toBeVisible();
    // Percentage has Basic Percentage pattern seeded in slice 1
    await expect(page.getByText("Basic Percentage")).toBeVisible();
  });

  test("topic page shows study resources", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { name: "Study Resources" })).toBeVisible();
  });

  test("topic page shows readiness section with two buttons", async ({ page }) => {
    await page.goto("/topics/percentage");
    await expect(page.getByRole("heading", { name: "Are you ready to practice?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ready to practice" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Not ready yet" })).toBeVisible();
  });

  test("clicking 'Not ready yet' shows confirmation message", async ({ page }) => {
    await page.goto("/topics/syllogisms");
    await page.getByRole("button", { name: "Not ready yet" }).click();
    await expect(page.getByText("Noted")).toBeVisible({ timeout: 10000 });
  });

  test("clicking 'Ready to practice' updates progress and redirects to dashboard", async ({ page }) => {
    await page.goto("/topics/rc-basics");
    await page.getByRole("button", { name: "Ready to practice" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
  });

  test("topic with dependencies shows dependency gate when not cleared", async ({ page }) => {
    // Profit & Loss depends on Percentage which the student hasn't cleared
    await page.goto("/topics/profit-and-loss");
    await expect(page.getByText("Complete these topics first")).toBeVisible();
    await expect(page.getByText("Percentage")).toBeVisible();
  });

  test("dashboard shows 'Not started' for topics with no progress", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Not started").first()).toBeVisible();
  });

  test("unauthenticated user is redirected from dashboard to login", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
    await context.close();
  });

  test("unauthenticated user is redirected from topic page to login", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/topics/percentage");
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
    await context.close();
  });
});
