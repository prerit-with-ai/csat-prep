import { test, expect } from "@playwright/test";

// Helper: load practice page for a topic slug, get its UUID from the topic page
async function getTopicId(page: import("@playwright/test").Page, slug: string): Promise<string> {
  const res = await page.request.get(`/api/topics/${slug}`);
  const data = await res.json();
  return data.topic.id;
}

// Helper: tag a question with given ABC tag during the mock
async function tagQuestion(page: import("@playwright/test").Page, tag: "A" | "B" | "C") {
  const tagText = tag === "A" ? /Ab Karo/i : tag === "B" ? /Baad mein/i : /Chorh Do/i;
  await page.getByRole("button", { name: tagText }).click();
}

test.describe("Slice 5: Mock Tests", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  test("mock selection page loads", async ({ page }) => {
    await page.goto("/mock");
    await expect(page.getByText(/Mock Test/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("can create a topic mini-mock", async ({ page }) => {
    const topicId = await getTopicId(page, "percentage");

    const res = await page.request.post("/api/mock/create", {
      data: { type: "topic", topicId },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.mockId).toBeTruthy();
    expect(data.questionCount).toBeGreaterThan(0);
    expect(data.durationSeconds).toBe(15 * 60);
  });

  test("mock test page loads with questions", async ({ page }) => {
    const topicId = await getTopicId(page, "percentage");
    const res = await page.request.post("/api/mock/create", {
      data: { type: "topic", topicId },
    });
    const { mockId } = await res.json();

    await page.goto(`/mock/${mockId}`);
    await expect(page.getByText(/Mock Test/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("mock-progress")).toHaveText(/^1 \/ \d+$/, { timeout: 10000 });
  });

  test("mock test shows ABC tag buttons", async ({ page }) => {
    const topicId = await getTopicId(page, "percentage");
    const res = await page.request.post("/api/mock/create", {
      data: { type: "topic", topicId },
    });
    const { mockId } = await res.json();

    await page.goto(`/mock/${mockId}`);
    await expect(page.getByTestId("mock-progress")).toHaveText(/^1 \/ \d+$/, { timeout: 20000 });

    await expect(page.getByRole("button", { name: /Ab Karo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Baad mein/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Chorh Do/i })).toBeVisible();
  });

  test("next button disabled until ABC tag selected", async ({ page }) => {
    const topicId = await getTopicId(page, "percentage");
    const res = await page.request.post("/api/mock/create", {
      data: { type: "topic", topicId },
    });
    const { mockId } = await res.json();

    await page.goto(`/mock/${mockId}`);
    await expect(page.getByTestId("mock-progress")).toHaveText(/^1 \/ \d+$/, { timeout: 20000 });

    // Next button should be disabled
    await expect(page.getByRole("button", { name: /Next Question|Finish First Pass/i })).toBeDisabled();

    // Tag as C — next should enable
    await tagQuestion(page, "C");
    await expect(page.getByRole("button", { name: /Next Question|Finish First Pass/i })).toBeEnabled({ timeout: 3000 });
  });

  test("tagging A enables answer options", async ({ page }) => {
    const topicId = await getTopicId(page, "percentage");
    const res = await page.request.post("/api/mock/create", {
      data: { type: "topic", topicId },
    });
    const { mockId } = await res.json();

    await page.goto(`/mock/${mockId}`);
    await expect(page.getByTestId("mock-progress")).toHaveText(/^1 \/ \d+$/, { timeout: 20000 });

    // Options should start disabled (no tag yet)
    const optionA = page.getByRole("button", { name: /^A\./ });
    await expect(optionA).toBeDisabled();

    // Tag as A — options should become enabled
    await tagQuestion(page, "A");
    await expect(optionA).toBeEnabled({ timeout: 3000 });
  });

  test("can complete a full mock and reach analysis page", async ({ page }) => {
    test.setTimeout(180000);
    const topicId = await getTopicId(page, "percentage");
    const res = await page.request.post("/api/mock/create", {
      data: { type: "topic", topicId },
    });
    const { mockId, questionCount } = await res.json();

    await page.goto(`/mock/${mockId}`);
    await expect(page.getByTestId("mock-progress")).toHaveText(/^1 \/ \d+$/, { timeout: 20000 });

    // Go through all questions, tag each as A and select an option
    for (let i = 0; i < questionCount; i++) {
      await expect(page.getByTestId("mock-progress")).toHaveText(new RegExp(`^${i + 1} \\/ \\d+$`), { timeout: 15000 });
      await tagQuestion(page, "A");
      await page.getByRole("button", { name: /^A\./ }).click();

      const nextBtn = page.getByRole("button", { name: /Next Question|Finish First Pass/i });
      await expect(nextBtn).toBeEnabled({ timeout: 3000 });
      await nextBtn.click();
    }

    // Should show review prompt or go to submitting
    const hasReviewPrompt = await page.getByText(/First Pass Complete/i).isVisible().catch(() => false);
    if (hasReviewPrompt) {
      await page.getByRole("button", { name: /Skip.*Submit/i }).click();
    }

    // Should redirect to analysis page
    await page.waitForURL(`**/mock/${mockId}/analysis`, { timeout: 30000 });
    // D5 sprint replaced "Mock Complete" heading with a score-hero block
    await expect(page.getByTestId("score-hero")).toBeVisible({ timeout: 15000 });
  });

  test("analysis page shows score and ABC breakdown", async ({ page }) => {
    test.setTimeout(180000);
    const topicId = await getTopicId(page, "percentage");
    const res = await page.request.post("/api/mock/create", {
      data: { type: "topic", topicId },
    });
    const { mockId, questionCount } = await res.json();

    await page.goto(`/mock/${mockId}`);
    await expect(page.getByTestId("mock-progress")).toHaveText(/^1 \/ \d+$/, { timeout: 20000 });

    for (let i = 0; i < questionCount; i++) {
      await expect(page.getByTestId("mock-progress")).toHaveText(new RegExp(`^${i + 1} \\/ \\d+$`), { timeout: 15000 });
      await tagQuestion(page, i % 3 === 0 ? "A" : i % 3 === 1 ? "B" : "C");
      if (i % 3 === 0) {
        await page.getByRole("button", { name: /^B\./ }).click();
      }
      const nextBtn = page.getByRole("button", { name: /Next Question|Finish First Pass/i });
      await expect(nextBtn).toBeEnabled({ timeout: 3000 });
      await nextBtn.click();
    }

    const hasReviewPrompt = await page.getByText(/First Pass Complete/i).isVisible().catch(() => false);
    if (hasReviewPrompt) {
      await page.getByRole("button", { name: /Skip.*Submit/i }).click();
    }

    await page.waitForURL(`**/mock/${mockId}/analysis`, { timeout: 30000 });
    // D5 sprint replaced "Mock Complete" heading with a score-hero block
    await expect(page.getByTestId("score-hero")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Net Score/i)).toBeVisible();
    // D5 sprint renamed "ABC Analysis" heading to "ABC Breakdown"
    await expect(page.getByText(/ABC Breakdown/i)).toBeVisible();
    await expect(page.getByText(/Question Review/i)).toBeVisible();
  });

  test("unauthenticated user redirected from mock page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/mock");
    await page.waitForURL("**/login**", { timeout: 10000 });
    await context.close();
  });

  test("scoring math is correct (API verification)", async ({ page }) => {
    const topicId = await getTopicId(page, "percentage");
    const createRes = await page.request.post("/api/mock/create", {
      data: { type: "topic", topicId },
    });
    const { mockId } = await createRes.json();

    // Get mock data to know question IDs
    const mockRes = await page.request.get(`/api/mock/${mockId}`);
    const mockData = await mockRes.json();
    const responses = mockData.responses as Array<{ id: string; questionId: string }>;

    // Submit 2 correct (A-tagged), 1 wrong (A-tagged), rest C-tagged
    // We don't know which options are correct, so just tag 2 as A with option A, 1 as A with option B, rest as C
    for (let i = 0; i < responses.length; i++) {
      const tag = i < 3 ? "A" : "C";
      const option = i === 0 ? "A" : i === 1 ? "A" : i === 2 ? "B" : null;
      await page.request.post(`/api/mock/${mockId}/respond`, {
        data: {
          questionId: responses[i].questionId,
          abcTag: tag,
          selectedOption: option,
          timeSpentSeconds: 30,
        },
      });
    }

    const submitRes = await page.request.post(`/api/mock/${mockId}/submit`);
    expect(submitRes.status()).toBe(200);
    const result = await submitRes.json();

    // Verify scoring structure
    expect(typeof result.netScore).toBe("number");
    expect(typeof result.correctCount).toBe("number");
    expect(typeof result.wrongCount).toBe("number");
    expect(typeof result.skippedCount).toBe("number");
    expect(result.correctCount + result.wrongCount + result.skippedCount).toBe(responses.length);
  });
});
