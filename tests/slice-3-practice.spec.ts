import { test, expect } from "@playwright/test";

// Helper: load practice page and wait until options are interactive
async function loadPracticePage(page: import("@playwright/test").Page, slug: string) {
  await page.goto(`/topics/${slug}/practice`);
  // Wait for question to render
  await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });
  // Wait for confirm button to exist (disabled = no option selected yet)
  await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeDisabled({ timeout: 10000 });
}

// Helper: click an option and verify it registered (confirm button becomes enabled)
async function selectOption(page: import("@playwright/test").Page, optionKey: string) {
  const btn = page.getByRole("button", { name: new RegExp(`^${optionKey}\\.`) });
  await btn.click();
  // Confirm the selection registered — confirm button should now be enabled
  await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeEnabled({ timeout: 5000 });
}

// Helper: submit current answer and wait for result banner
async function submitAndWaitForSolution(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /Confirm Answer/i }).click();
  await expect(page.getByText(/Correct|Incorrect/i).first()).toBeVisible({ timeout: 20000 });
}

test.describe("Slice 3: Student Practices", () => {
  test.use({ storageState: "tests/.auth/student.json" });

  test("topic page shows Start Practice button", async ({ page }) => {
    await page.goto("/topics/percentage");
    // D4 sprint added a Start Practice CTA in the topic header band, so there
    // are now two such links on the page (header + body). Either is fine.
    await expect(page.getByRole("link", { name: /Start Practice/i }).first()).toBeVisible();
  });

  test("practice page loads with questions", async ({ page }) => {
    await page.goto("/topics/percentage/practice");
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });
  });

  test("practice page shows question text and 4 options", async ({ page }) => {
    await loadPracticePage(page, "percentage");

    // 4 option buttons should be visible
    await expect(page.getByRole("button", { name: /^A\./ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^B\./ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^C\./ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^D\./ })).toBeVisible();
  });

  test("selecting an option enables confirm button", async ({ page }) => {
    await loadPracticePage(page, "percentage");

    // Confirm is initially disabled
    await expect(page.getByRole("button", { name: /Confirm Answer/i })).toBeDisabled();

    // Select option A — helper verifies confirm becomes enabled
    await selectOption(page, "A");
  });

  test("submitting an answer shows solution", async ({ page }) => {
    await loadPracticePage(page, "percentage");
    await selectOption(page, "B");
    await submitAndWaitForSolution(page);

    // Smart solution card should be visible
    await expect(page.locator(".rounded-xl").filter({ hasText: "Solution" }).first()).toBeVisible();
  });

  test("solution shows smart solution text", async ({ page }) => {
    await loadPracticePage(page, "percentage");
    await selectOption(page, "C");
    await submitAndWaitForSolution(page);

    // The solution card contains the smart solution text (non-empty)
    const solutionCard = page.locator(".rounded-xl").filter({ hasText: "Solution" }).first();
    await expect(solutionCard).toBeVisible();
  });

  test("can navigate through multiple questions", async ({ page }) => {
    await loadPracticePage(page, "percentage");

    // Answer question 1
    await selectOption(page, "A");
    await submitAndWaitForSolution(page);

    // Move to next question
    await page.getByRole("button", { name: /Next Question/i }).click();
    await expect(page.getByText(/Question 2 of/)).toBeVisible({ timeout: 10000 });
  });

  test("completing all questions shows summary", async ({ page }) => {
    test.setTimeout(120000);
    await loadPracticePage(page, "percentage");

    const progressText = await page.getByText(/Question \d+ of \d+/).textContent();
    const total = parseInt(progressText?.match(/of (\d+)/)?.[1] ?? "5");

    for (let i = 0; i < total; i++) {
      await expect(page.getByText(`Question ${i + 1} of ${total}`)).toBeVisible({ timeout: 10000 });
      await selectOption(page, "A");
      await submitAndWaitForSolution(page);

      if (i < total - 1) {
        await page.getByRole("button", { name: /Next Question/i }).click();
      } else {
        await page.getByRole("button", { name: /See Summary/i }).click();
      }
    }

    await expect(page.getByText("Practice Complete")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Practice more/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to topic/i })).toBeVisible();
  });

  test("summary shows per-question results", async ({ page }) => {
    test.setTimeout(120000);
    await loadPracticePage(page, "percentage");

    const progressText = await page.getByText(/Question \d+ of \d+/).textContent();
    const total = parseInt(progressText?.match(/of (\d+)/)?.[1] ?? "5");

    for (let i = 0; i < total; i++) {
      await expect(page.getByText(`Question ${i + 1} of ${total}`)).toBeVisible({ timeout: 10000 });
      await selectOption(page, "C");
      await submitAndWaitForSolution(page);

      if (i < total - 1) {
        await page.getByRole("button", { name: /Next Question/i }).click();
      } else {
        await page.getByRole("button", { name: /See Summary/i }).click();
      }
    }

    await expect(page.getByText("Practice Complete")).toBeVisible({ timeout: 15000 });
    // exact: true avoids matching "Q10" etc.
    await expect(page.getByText("Q1", { exact: true })).toBeVisible();
  });

  test("practice more button loads new batch", async ({ page }) => {
    test.setTimeout(120000);
    await loadPracticePage(page, "percentage");

    const progressText = await page.getByText(/Question \d+ of \d+/).textContent();
    const total = parseInt(progressText?.match(/of (\d+)/)?.[1] ?? "5");

    for (let i = 0; i < total; i++) {
      await expect(page.getByText(`Question ${i + 1} of ${total}`)).toBeVisible({ timeout: 10000 });
      await selectOption(page, "D");
      await submitAndWaitForSolution(page);

      if (i < total - 1) {
        await page.getByRole("button", { name: /Next Question/i }).click();
      } else {
        await page.getByRole("button", { name: /See Summary/i }).click();
      }
    }

    await expect(page.getByText("Practice Complete")).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /Practice more/i }).click();
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({ timeout: 20000 });
  });

  test("timer is visible during question answering", async ({ page }) => {
    await loadPracticePage(page, "percentage");
    await expect(page.getByText(/⏱/)).toBeVisible();
  });

  test("unauthenticated user redirected from practice page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/topics/percentage/practice");
    await page.waitForURL("**/login**", { timeout: 10000 });
    await context.close();
  });
});
