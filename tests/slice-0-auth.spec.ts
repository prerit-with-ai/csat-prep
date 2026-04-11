import { test, expect } from "@playwright/test";

const TEST_STUDENT = {
  name: "Test Student",
  email: `test-student-${Date.now()}@csatcracker.com`,
  password: "teststudent123",
};

const TEST_ADMIN = {
  email: "admin@csatcracker.com",
  password: "admin12345",
};

test.describe("Slice 0: Auth & Foundation", () => {
  // Auth tests must run without pre-existing session state
  test.use({ storageState: { cookies: [], origins: [] } });
  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("unauthenticated user is redirected to login from dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to login from admin", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("register page loads and has form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("login page loads and has form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("can register as a new student and reach onboarding", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByLabel("Name").fill(TEST_STUDENT.name);
    await page.getByLabel("Email").fill(TEST_STUDENT.email);
    await page.getByLabel("Password").fill(TEST_STUDENT.password);
    await page.getByRole("button", { name: "Create account" }).click();

    // New registrations are routed through the onboarding flow (commit 415a9b5)
    await page.waitForURL("**/onboarding", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Meet CSAT/i })).toBeVisible();
  });

  test("can login as admin and reach admin dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(TEST_ADMIN.email);
    await page.getByLabel("Password").fill(TEST_ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Admin should be redirected to admin dashboard
    await page.waitForURL("**/admin", { timeout: 10000 });
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
  });

  test("student cannot access admin routes", async ({ browser }) => {
    // Use the seeded student session (bypasses the register->onboarding flow)
    const context = await browser.newContext({ storageState: "tests/.auth/student.json" });
    const page = await context.newPage();

    // Try to access admin page — should redirect to dashboard
    await page.goto("/admin");
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");

    await context.close();
  });
});
