import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();

  // Login as admin and save session state
  const adminPage = await browser.newPage();
  await adminPage.goto(`${baseURL}/login`);
  await adminPage.getByLabel("Email").fill("admin@csatcracker.com");
  await adminPage.getByLabel("Password").fill("admin12345");
  await adminPage.getByRole("button", { name: "Sign in" }).click();
  await adminPage.waitForURL("**/admin**", { timeout: 30000 });
  await adminPage.context().storageState({ path: "tests/.auth/admin.json" });
  await adminPage.close();

  // Login as student and save session state
  const studentPage = await browser.newPage();
  await studentPage.goto(`${baseURL}/login`);
  await studentPage.getByLabel("Email").fill("student@csatcracker.com");
  await studentPage.getByLabel("Password").fill("student12345");
  await studentPage.getByRole("button", { name: "Sign in" }).click();
  await studentPage.waitForURL("**/dashboard**", { timeout: 30000 });
  await studentPage.context().storageState({ path: "tests/.auth/student.json" });
  await studentPage.close();

  await browser.close();
}

export default globalSetup;
