const { test, expect } = require("@playwright/test");

test("Rebel v2 follows the course-first learning flow", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e));
  await page.goto("/");
  await expect(page.locator(".rebel-shell")).toBeVisible();
  await expect(page.locator("#pageTitle")).toHaveText("Home");

  await page.getByRole("button", { name: /Courses/ }).first().click();
  await expect(page.locator("#pageTitle")).toHaveText("Courses");
  await expect(page.locator(".course-card")).toHaveCount(3);

  await page.locator("[data-course='foundations']").click();
  await expect(page.locator(".course-detail")).toBeVisible();
  await expect(page.locator(".chapter")).toHaveCount(2);

  await page.locator("[data-lesson='fund-1']").click();
  await expect(page.locator(".lesson-view")).toBeVisible();
  await expect(page.locator(".rebel-board")).toBeVisible();

  await page.getByRole("button", { name: /Next lesson|Complete course/ }).click();
  await expect(page.locator(".lesson-view")).toBeVisible();

  expect(errors.map(e => e.message)).toEqual([]);
});

test("trainer exposes shuffle and isolated training board", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Trainer/ }).click();
  await expect(page.locator("#pageTitle")).toHaveText("Trainer");
  await expect(page.getByText("Drill Shuffle")).toBeVisible();
  await expect(page.locator("[data-drill]")).toHaveCount(3);
  await page.locator("[data-drill='fork']").click();
  await expect(page.locator("#trainer-board")).toBeVisible();
  await expect(page.locator("#trainer-status")).toContainText(/Finding|Position|Engine/);
});

test("play and analysis use separate board state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Board$/ }).click();
  await page.locator("[data-square='e2']").click();
  await page.locator("[data-square='e4']").click();
  await expect(page.locator("#workspaceMoves")).toContainText("e4");

  await page.getByRole("button", { name: /Analyze position/ }).click();
  await expect(page.locator("#pageTitle")).toHaveText("Analysis");
  await expect(page.locator(".rebel-board")).toBeVisible();
  await expect(page.locator("#analysis-report")).toBeEmpty();
});

test("progress page remains available after the learning flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Progress/ }).click();
  await expect(page.locator("#pageTitle")).toHaveText("Progress");
  await expect(page.locator(".achievement-row")).toBeVisible();
});
