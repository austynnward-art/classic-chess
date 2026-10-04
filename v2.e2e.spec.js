const { test, expect } = require("@playwright/test");

test("Rebel v2 shell boots and navigates", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e));
  await page.goto("/");
  await expect(page.locator(".rebel-shell")).toBeVisible();
  await expect(page.locator(".rebel-sidebar")).toBeVisible();
  await expect(page.locator("#pageTitle")).toHaveText("Home");
  await page.getByRole("button", { name: /Courses/ }).click();
  await expect(page.locator("#pageTitle")).toHaveText("Courses");
  await expect(page.locator(".course-card")).toHaveCount(3);
  await page.getByRole("button", { name: /Progress/ }).click();
  await expect(page.locator("#pageTitle")).toHaveText("Progress");
  expect(errors.map(e => e.message)).toEqual([]);
});
