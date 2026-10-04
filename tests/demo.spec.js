const { test, expect } = require("@playwright/test");
test.use({ video: "on" });

test("Classic Chess learning walkthrough", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#board .sq")).toHaveCount(64);
  await page.getByRole("button", { name: "Trainer" }).click();
  await expect(page.locator("#trainerBoard .sq")).toHaveCount(64);
  await page.getByRole("button", { name: "Courses" }).click();
  await expect(page.locator("#courseBoard .sq")).toHaveCount(64);
  await page.getByRole("button", { name: "Videos" }).click();
  await expect(page.locator("#videoPage iframe")).toHaveCount(2);
  await page.waitForTimeout(500);
});
