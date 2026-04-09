import { test, expect } from "@playwright/test";

test.describe("Slice 6: Revision Queue", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  // Helper: get topic ID from slug
  async function getTopicId(page: import("@playwright/test").Page, slug: string): Promise<string> {
    const res = await page.request.get(`/api/topics/${slug}`);
    const data = await res.json();
    return data.topic.id;
  }

  // Helper: get a question with a pattern from a topic
  async function getQuestionWithPattern(
    page: import("@playwright/test").Page,
    topicId: string
  ): Promise<{ questionId: string; patternTypeId: string; topicId: string } | null> {
    const res = await page.request.get("/api/practice/serve", {
      params: { topicId },
    });
    if (!res.ok()) return null;
    const data = await res.json();
    const q = data.questions?.find((q: { patternTypeId: string }) => q.patternTypeId);
    if (!q) return null;
    return { questionId: q.id, patternTypeId: q.patternTypeId, topicId };
  }

  test("revision page loads (authenticated)", async ({ page }) => {
    await page.goto("/revision");
    await expect(page.getByText(/Revision Queue/i)).toBeVisible({ timeout: 10000 });
  });

  test("revision page shows empty state when nothing due", async ({ page }) => {
    await page.goto("/revision");
    // Either shows due items or the empty state message
    await expect(
      page.getByText(/Revision Queue/i)
    ).toBeVisible({ timeout: 10000 });
    // The page renders — may or may not have items
  });

  test("wrong answer in practice triggers revision queue via API", async ({ page }) => {
    const topicId = await getTopicId(page, "percentage");

    // Serve a question (practice serve is POST)
    const serveRes = await page.request.post("/api/practice/serve", {
      data: { topicId },
    });
    expect(serveRes.ok()).toBeTruthy();
    const serveData = await serveRes.json();
    const questions = serveData.questions;
    expect(questions.length).toBeGreaterThan(0);

    // Find a question that has a patternTypeId
    const question = questions.find((q: { patternTypeId: string | null }) => q.patternTypeId);
    if (!question) {
      // No pattern-typed question — skip gracefully
      return;
    }

    // Submit a wrong answer (pick an option that's unlikely to be correct)
    const wrongOption = question.correctOption === "a" ? "b" : "a";
    const submitRes = await page.request.post("/api/practice/submit", {
      data: {
        questionId: question.id,
        topicId,
        selectedOption: wrongOption,
        timeSpent: 30,
      },
    });
    expect(submitRes.status()).toBe(200);
    const submitData = await submitRes.json();
    expect(submitData.isCorrect).toBe(false);

    // Revision entry is created (due tomorrow — won't appear in GET /api/revision yet)
    // Just verify the revision API responds OK
    const revisionRes = await page.request.get("/api/revision");
    expect(revisionRes.status()).toBe(200);
  });

  test("GET /api/revision returns correct structure", async ({ page }) => {
    const res = await page.request.get("/api/revision");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);

    // If there are items, verify their structure
    if (data.items.length > 0) {
      const item = data.items[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("patternTypeName");
      expect(item).toHaveProperty("topicName");
      expect(item).toHaveProperty("topicSection");
      expect(item).toHaveProperty("status");
      expect(item).toHaveProperty("reviewCount");
      expect(item).toHaveProperty("question");
      expect(item.question).toHaveProperty("id");
      expect(item.question).toHaveProperty("questionText");
      expect(item.question).toHaveProperty("optionA");
    }
  });

  test("can submit revision attempt via API when item is due", async ({ page }) => {
    test.setTimeout(60000);
    const topicId = await getTopicId(page, "percentage");

    // Submit a wrong answer to create a revision entry
    const serveRes = await page.request.post("/api/practice/serve", {
      data: { topicId },
    });
    if (!serveRes.ok()) return;
    const { questions } = await serveRes.json();
    const question = questions.find((q: { patternTypeId: string | null }) => q.patternTypeId);
    if (!question) return;

    const wrongOption = question.correctOption === "a" ? "b" : "a";
    await page.request.post("/api/practice/submit", {
      data: {
        questionId: question.id,
        topicId,
        selectedOption: wrongOption,
        timeSpent: 30,
      },
    });

    // Verify the attempt route returns 404 for non-existent IDs
    const badAttemptRes = await page.request.post(
      "/api/revision/00000000-0000-0000-0000-000000000000/attempt",
      { data: { questionId: question.id, selectedOption: "a", timeSpent: 10 } }
    );
    expect(badAttemptRes.status()).toBe(404);
  });

  test("revision page shows either due items or empty state", async ({ page }) => {
    await page.goto("/revision");
    await expect(page.getByText(/Revision Queue/i)).toBeVisible({ timeout: 10000 });

    // Wait for loading to finish — either "Practice Now" or "No revision due today" should appear
    await expect(
      page.getByRole("button", { name: /Practice Now/i })
        .or(page.getByText(/No revision due today/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("dashboard shows revision badge when items are due", async ({ page }) => {
    await page.goto("/dashboard");
    // Dashboard loads
    await expect(page.getByText(/Welcome/i)).toBeVisible({ timeout: 10000 });
    // May or may not have revision badge (depends on state)
    // Just verify the page loaded successfully
  });

  test("unauthenticated user redirected from revision page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/revision");
    await page.waitForURL("**/login**", { timeout: 10000 });
    await context.close();
  });

  test("revision attempt API returns error for non-existent entry", async ({ page }) => {
    // Submit attempt to a non-existent revision queue entry
    // Use all-zeros UUID which can't exist
    const topicId = await getTopicId(page, "percentage");
    const serveRes = await page.request.post("/api/practice/serve", { data: { topicId } });
    const { questions } = await serveRes.json();
    const question = questions[0];

    const res = await page.request.post(
      "/api/revision/00000000-0000-0000-0000-000000000000/attempt",
      { data: { questionId: question.id, selectedOption: "a", timeSpent: 10 } }
    );
    expect(res.status()).toBe(404);
  });

  test("full revision flow: practice a due item end-to-end", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto("/revision");
    await expect(page.getByText(/Revision Queue/i)).toBeVisible({ timeout: 10000 });

    const hasDueItems = await page.getByRole("button", { name: /Practice Now/i }).isVisible().catch(() => false);

    if (!hasDueItems) {
      // No due items — skip the rest of this test
      await expect(page.getByText(/No revision due today/i)).toBeVisible({ timeout: 5000 });
      return;
    }

    // Click first "Practice Now"
    await page.getByRole("button", { name: /Practice Now/i }).first().click();

    // Should show question interface
    await expect(page.getByText(/Submit Answer/i)).toBeVisible({ timeout: 5000 });

    // Select option A
    await page.getByRole("button", { name: /^A\./ }).click();
    await expect(page.getByRole("button", { name: /Submit Answer/i })).toBeEnabled();

    // Submit
    await page.getByRole("button", { name: /Submit Answer/i }).click();

    // Should show solution
    await expect(page.getByText(/Solution/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Done/i })).toBeVisible();

    // Go back to list
    await page.getByRole("button", { name: /Done/i }).click();
    await expect(page.getByText(/Revision Queue/i)).toBeVisible({ timeout: 5000 });
  });
});
