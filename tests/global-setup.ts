import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Login as admin and save session state
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Email").fill("admin@csatcracker.com");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin**", { timeout: 30000 });

  await page.context().storageState({ path: "tests/.auth/admin.json" });
  await browser.close();
}

export default globalSetup;
