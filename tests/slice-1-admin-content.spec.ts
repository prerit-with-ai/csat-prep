import { test, expect } from "@playwright/test";

// Authenticated admin tests — uses pre-established session from global-setup
test.describe("Slice 1: Admin Seeds Content", () => {
  // All tests in this block reuse the admin session saved in global-setup
  test.use({ storageState: "tests/.auth/admin.json" });

  test("admin dashboard shows Topics and Questions navigation cards", async ({ page }) => {
    await page.goto("/admin");
    // Admin pages have both a nav link and a dashboard card for each section,
    // so these locators intentionally match multiple elements — .first() is enough.
    await expect(page.getByRole("link", { name: /Topics/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Questions/ }).first()).toBeVisible();
  });

  test("admin topics page loads with New Topic button", async ({ page }) => {
    await page.goto("/admin/topics");
    await expect(page.getByRole("heading", { name: "Topics" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New Topic" })).toBeVisible();
  });

  test("topics list shows seeded Percentage topic", async ({ page }) => {
    await page.goto("/admin/topics");
    await expect(page.getByText("Percentage")).toBeVisible();
    await expect(page.getByText("Math").first()).toBeVisible();
  });

  test("admin can create a new topic", async ({ page }) => {
    await page.goto("/admin/topics/new");
    await expect(page.getByRole("heading", { name: "New Topic" })).toBeVisible();

    const topicName = `E2E Topic ${Date.now()}`;
    const slug = `e2e-topic-${Date.now()}`;

    await page.getByLabel("Name").fill(topicName);
    await page.getByLabel("Slug").clear();
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Section").selectOption("lr");

    await page.getByRole("button", { name: "Create Topic" }).click();

    await page.waitForURL("**/admin/topics/**", { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("topic detail page shows pattern types and resources", async ({ page }) => {
    // Navigate directly via API to avoid click reliability issues
    const res = await page.request.get("/api/admin/topics");
    const { topics } = await res.json();
    const percentage = topics.find((t: { name: string }) => t.name === "Percentage");
    await page.goto(`/admin/topics/${percentage.id}`);

    await expect(page.getByText("Pattern Types")).toBeVisible();
    await expect(page.getByText("Resources")).toBeVisible();
    await expect(page.getByText("Basic Percentage")).toBeVisible();
  });

  test("cheatsheet preview is shown on topic detail page", async ({ page }) => {
    const res = await page.request.get("/api/admin/topics");
    const { topics } = await res.json();
    const percentage = topics.find((t: { name: string }) => t.name === "Percentage");
    await page.goto(`/admin/topics/${percentage.id}`);

    await expect(page.getByText("Cheatsheet")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" }).first()).toBeVisible();
  });

  test("admin can add a pattern type to a topic", async ({ page }) => {
    const res = await page.request.get("/api/admin/topics");
    const { topics } = await res.json();
    const percentage = topics.find((t: { name: string }) => t.name === "Percentage");
    await page.goto(`/admin/topics/${percentage.id}`);

    await page.getByRole("button", { name: "Add Pattern Type" }).click();
    await page.getByPlaceholder("e.g., Basic Percentage").fill("E2E Test Pattern");
    await page.getByRole("button", { name: "Add Pattern" }).click();

    // Wait for router.refresh() to complete and new pattern to appear
    await expect(page.getByText("E2E Test Pattern").first()).toBeVisible({ timeout: 10000 });
  });

  test("admin questions page loads", async ({ page }) => {
    await page.goto("/admin/questions");
    await expect(page.getByRole("heading", { name: "Questions" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New Question" })).toBeVisible();
  });

  test("questions page shows seeded Percentage questions", async ({ page }) => {
    await page.goto("/admin/questions");
    await expect(page.getByText(/Showing/)).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("questions can be filtered by difficulty", async ({ page }) => {
    await page.goto("/admin/questions");

    // Use the difficulty select (second select in the filter bar)
    await page.locator("select").nth(1).selectOption("l1");
    await page.getByRole("button", { name: "Filter" }).click();

    await page.waitForURL(/difficulty=l1/, { timeout: 5000 });
    // L1 badge should appear in table body
    await expect(page.locator("table tbody").getByText("L1").first()).toBeVisible({ timeout: 5000 });
  });

  test("admin new question page loads with form", async ({ page }) => {
    await page.goto("/admin/questions/new");
    await expect(page.getByRole("heading", { name: "New Question" })).toBeVisible();
    await expect(page.getByText("Topic *")).toBeVisible();
    await expect(page.getByText("Difficulty *")).toBeVisible();
  });

  test("admin can create a new question", async ({ page }) => {
    await page.goto("/admin/questions/new");

    // Wait for topics dropdown to populate
    await page.waitForFunction(() => {
      const sel = document.querySelectorAll("select")[0] as HTMLSelectElement;
      return sel && sel.options.length > 1;
    }, { timeout: 10000 });

    // Select Percentage topic by finding the option text
    const topicSelect = page.locator("select").first();
    const options = await topicSelect.locator("option").all();
    for (const opt of options) {
      const text = await opt.textContent();
      if (text?.includes("Percentage")) {
        const value = await opt.getAttribute("value");
        await topicSelect.selectOption({ value: value! });
        break;
      }
    }

    // Select difficulty (4th select — D1 sprint added a passage selector at index 2)
    await page.locator("select").nth(3).selectOption("l1");

    // Fill question text (first textarea)
    await page.locator("textarea").first().fill("What is 50% of 200?");

    // Fill options — nth(0) is subtopic (optional), options start at nth(1)
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(1).fill("80");  // Option A
    await textInputs.nth(2).fill("100"); // Option B
    await textInputs.nth(3).fill("120"); // Option C
    await textInputs.nth(4).fill("150"); // Option D

    // Select correct option B
    await page.locator('input[name="correctOption"][value="b"]').click();

    // Fill smart solution (second textarea)
    await page.locator("textarea").nth(1).fill("50% = half. 200 ÷ 2 = 100");

    // Submit
    await page.getByRole("button", { name: "Create Question" }).click();

    await page.waitForURL("**/admin/questions", { timeout: 10000 });
  });
});

// Unauthenticated tests — use a fresh (no cookies) context
test.describe("Slice 1: Unauthenticated access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated user cannot access admin topics", async ({ page }) => {
    await page.goto("/admin/topics");
    await page.waitForURL("**/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user cannot access admin questions", async ({ page }) => {
    await page.goto("/admin/questions");
    await page.waitForURL("**/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });
});
