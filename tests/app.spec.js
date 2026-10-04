const { test, expect } = require("@playwright/test");

test("application smoke test", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error));
  await page.goto("/");
  await expect(page.locator("#board .sq")).toHaveCount(64);
  await expect(page.locator("#board .piece")).toHaveCount(32);
  expect(errors.map(e => e.message)).toEqual([]);
});

test("learning, course, video and rules navigation works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Trainer" }).click();
  await expect(page.locator("#trainerBoard .sq")).toHaveCount(64);
  await page.getByRole("button", { name: "Courses" }).click();
  await expect(page.locator("#courseBoard .sq")).toHaveCount(64);
  await page.getByRole("button", { name: "Videos" }).click();
  await expect(page.locator("#videoPage iframe")).toHaveCount(2);
  await page.getByRole("button", { name: "Rules" }).click();
  await expect(page.locator("#rulesPage a")).toHaveCount(3);
});
