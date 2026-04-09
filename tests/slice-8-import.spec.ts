import { test, expect } from "@playwright/test";

test.describe("Slice 8: Bulk Import", () => {
  test.describe("Admin import API", () => {
    test.use({ storageState: "tests/.auth/admin.json" });

    test("preview with valid rows returns correct structure", async ({ page }) => {
      const res = await page.request.post("/api/admin/questions/import", {
        data: {
          preview: true,
          rows: [
            {
              topicSlug: "percentage",
              difficulty: "l1",
              questionText: "Import test: What is 10% of 200?",
              optionA: "20",
              optionB: "10",
              optionC: "30",
              optionD: "40",
              correctOption: "a",
              smartSolution: "10% of 200 = 20",
              sourceType: "custom",
            },
          ],
        },
      });
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("summary");
      expect(data.summary).toHaveProperty("total");
      expect(data.summary).toHaveProperty("valid");
      expect(data.summary).toHaveProperty("duplicates");
      expect(data.summary).toHaveProperty("invalid");
      expect(data.summary.total).toBe(1);
      expect(Array.isArray(data.invalid)).toBe(true);
      expect(Array.isArray(data.duplicates)).toBe(true);
    });

    test("preview with invalid topicSlug reports error", async ({ page }) => {
      const res = await page.request.post("/api/admin/questions/import", {
        data: {
          preview: true,
          rows: [
            {
              topicSlug: "nonexistent-topic-xyz",
              difficulty: "l1",
              questionText: "Test question?",
              optionA: "A",
              optionB: "B",
              optionC: "C",
              optionD: "D",
              correctOption: "a",
              smartSolution: "Solution",
            },
          ],
        },
      });
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data.summary.invalid).toBe(1);
      expect(data.invalid[0].reason).toMatch(/topic/i);
    });

    test("preview with missing required fields returns 400", async ({ page }) => {
      const res = await page.request.post("/api/admin/questions/import", {
        data: {
          preview: true,
          rows: [
            {
              topicSlug: "percentage",
              difficulty: "l1",
              // missing questionText, options, correctOption, smartSolution
            },
          ],
        },
      });
      // Schema validation rejects the whole request — rows must have required fields
      expect(res.status()).toBe(400);
    });

    test("preview does not insert into DB", async ({ page }) => {
      const uniqueText = `Preview-only test question ${Date.now()}`;
      await page.request.post("/api/admin/questions/import", {
        data: {
          preview: true,
          rows: [
            {
              topicSlug: "percentage",
              difficulty: "l1",
              questionText: uniqueText,
              optionA: "A",
              optionB: "B",
              optionC: "C",
              optionD: "D",
              correctOption: "a",
              smartSolution: "Sol",
            },
          ],
        },
      });

      // A second preview with the same text should NOT flag it as duplicate
      // (since first run was preview-only and didn't insert)
      const res2 = await page.request.post("/api/admin/questions/import", {
        data: {
          preview: true,
          rows: [
            {
              topicSlug: "percentage",
              difficulty: "l1",
              questionText: uniqueText,
              optionA: "A",
              optionB: "B",
              optionC: "C",
              optionD: "D",
              correctOption: "a",
              smartSolution: "Sol",
            },
          ],
        },
      });
      const data2 = await res2.json();
      expect(data2.summary.duplicates).toBe(0);
    });

    test("confirm import inserts valid rows", async ({ page }) => {
      const uniqueText = `Confirm import test ${Date.now()}`;
      const res = await page.request.post("/api/admin/questions/import", {
        data: {
          preview: false,
          rows: [
            {
              topicSlug: "percentage",
              difficulty: "l1",
              questionText: uniqueText,
              optionA: "20",
              optionB: "10",
              optionC: "30",
              optionD: "40",
              correctOption: "a",
              smartSolution: "Solution here",
              sourceType: "custom",
            },
          ],
        },
      });
      expect([200, 201]).toContain(res.status());
      const data = await res.json();
      expect(data).toHaveProperty("inserted");
      expect(data.inserted).toBe(1);
    });

    test("duplicate detection works on second import of same text", async ({ page }) => {
      const uniqueText = `Dup detection test ${Date.now()}`;
      const row = {
        topicSlug: "percentage",
        difficulty: "l1",
        questionText: uniqueText,
        optionA: "A",
        optionB: "B",
        optionC: "C",
        optionD: "D",
        correctOption: "a",
        smartSolution: "Sol",
        sourceType: "custom",
      };

      // First: insert
      await page.request.post("/api/admin/questions/import", {
        data: { preview: false, rows: [row] },
      });

      // Second: should flag as duplicate
      const res2 = await page.request.post("/api/admin/questions/import", {
        data: { preview: true, rows: [row] },
      });
      const data2 = await res2.json();
      expect(data2.summary.duplicates).toBe(1);
    });

    test("student cannot access import API", async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: "tests/.auth/student.json" });
      const page = await ctx.newPage();
      const res = await page.request.post("/api/admin/questions/import", {
        data: { preview: true, rows: [] },
      });
      expect(res.status()).toBe(403);
      await ctx.close();
    });

    test("import page loads for admin", async ({ page }) => {
      await page.goto("/admin/import");
      await expect(page.getByText(/Import/i).first()).toBeVisible({ timeout: 10000 });
    });

    test("admin dashboard shows Bulk Import nav card", async ({ page }) => {
      await page.goto("/admin");
      await expect(page.getByText(/Bulk Import/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
