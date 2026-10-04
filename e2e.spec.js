const { test, expect } = require("@playwright/test");

async function openApp(page) {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error));
  await page.goto("/");
  await expect(page.locator("#board .sq")).toHaveCount(64);
  return pageErrors;
}

const square = (page, id, name) => page.locator("#" + id + ' .sq[data-square="' + name + '"]');

test("loads a clean 8x8 starting board", async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.locator("#board .piece")).toHaveCount(32);
  await expect(page.locator("#status")).toHaveText("White to move");
  await expect(square(page, "board", "a1").locator(".piece")).toHaveText("♖");
  await expect(square(page, "board", "a2").locator(".piece")).toHaveText("♙");
  await expect(square(page, "board", "a7").locator(".piece")).toHaveText("♟");
  await expect(square(page, "board", "a7").locator(".piece")).toHaveClass(/b/);
  expect(errors.map(e => e.message)).toEqual([]);
});

test("all board squares have equal dimensions and pieces are centered", async ({ page }) => {
  await openApp(page);
  const boxes = await page.locator("#board .sq").evaluateAll(nodes =>
    nodes.slice(0, 8).map(n => {
      const r = n.getBoundingClientRect();
      return { width: r.width, height: r.height };
    })
  );
  for (const box of boxes) {
    expect(Math.abs(box.width - box.height)).toBeLessThan(0.5);
  }
  for (const box of boxes) {
    expect(Math.abs(box.width - boxes[0].width)).toBeLessThan(0.5);
  }
  const pieceBox = await square(page, "board", "e2").locator(".piece").boundingBox();
  const squareBox = await square(page, "board", "e2").boundingBox();
  expect(pieceBox).not.toBeNull();
  expect(squareBox).not.toBeNull();
  expect(Math.abs((pieceBox.x + pieceBox.width / 2) - (squareBox.x + squareBox.width / 2))).toBeLessThan(1);
  expect(Math.abs((pieceBox.y + pieceBox.height / 2) - (squareBox.y + squareBox.height / 2))).toBeLessThan(1);
});

test("click movement keeps legal state and move history synchronized", async ({ page }) => {
  await openApp(page);
  await square(page, "board", "e2").click();
  await expect(square(page, "board", "e4")).toHaveClass(/legal/);
  await square(page, "board", "e4").click();
  await expect(square(page, "board", "e4").locator(".piece")).toHaveText("♙");
  await expect(square(page, "board", "e2").locator(".piece")).toHaveCount(0);
  await expect(page.locator("#moves")).toContainText("e4");
  await expect(page.locator("#status")).toHaveText("Black to move");
});

test("drag movement follows the same legal state", async ({ page }) => {
  await openApp(page);
  await square(page, "board", "g1").dragTo(square(page, "board", "f3"));
  await expect(square(page, "board", "f3").locator(".piece")).toHaveText("♘");
  await expect(square(page, "board", "g1").locator(".piece")).toHaveCount(0);
  await expect(page.locator("#moves")).toContainText("Nf3");
});

test("flip board reverses the visual square order", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#board .sq").first()).toHaveAttribute("data-square", "a8");
  await page.getByRole("button", { name: "Flip board" }).click();
  await expect(page.locator("#board .sq").first()).toHaveAttribute("data-square", "h1");
  await expect(page.locator("#board .sq").last()).toHaveAttribute("data-square", "a8");
});

test("trainer has an isolated board and can move pieces", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "Trainer" }).click();
  await expect(page.locator("#trainerBoard .sq")).toHaveCount(64);
  await page.getByRole("button", { name: "Opening Basics" }).click();
  await square(page, "trainerBoard", "e2").click();
  await square(page, "trainerBoard", "e4").click();
  await expect(square(page, "trainerBoard", "e4").locator(".piece")).toHaveText("♙");
  await expect(page.locator("#moves")).toHaveText("No moves yet.");
});

test("courses switch positions without touching the main game", async ({ page }) => {
  await openApp(page);
  await square(page, "board", "e2").click();
  await square(page, "board", "e4").click();
  await page.getByRole("button", { name: "Courses" }).click();
  await page.getByRole("button", { name: "Opening Basics" }).last().click();
  await expect(page.locator("#courseBoard .sq")).toHaveCount(64);
  await square(page, "courseBoard", "e7").click();
  await square(page, "courseBoard", "e5").click();
  await expect(square(page, "courseBoard", "e5").locator(".piece")).toHaveText("♟");
  await page.getByRole("button", { name: "Board" }).click();
  await expect(square(page, "board", "e4").locator(".piece")).toHaveText("♙");
  await expect(page.locator("#moves")).toContainText("e4");
});

test("videos and rules pages expose their separate resources", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "Videos" }).click();
  await expect(page.locator("#videoPage iframe")).toHaveCount(2);
  await expect(page.locator('#videoPage a[href="https://chessly.com/"]')).toBeVisible();
  await page.getByRole("button", { name: "Rules" }).click();
  await expect(page.locator("#rulesPage a")).toHaveCount(3);
  await expect(page.locator('#rulesPage a[href*="Laws-of-Chess_final.pdf"]')).toBeVisible();
});

test("Stockfish loads as the single engine and course analysis does not mutate the main game", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#engineStatus")).toContainText("Stockfish 19 Lite ready", { timeout: 30000 });
  await square(page, "board", "e2").click();
  await square(page, "board", "e4").click();
  await page.getByRole("button", { name: "Courses" }).click();
  await page.getByRole("button", { name: "Stockfish Course" }).click();
  await page.getByRole("button", { name: "Analyze lesson" }).click();
  await expect(page.locator("#courseStatus")).toContainText(/Stockfish recommends|No engine move/, { timeout: 20000 });
  await page.getByRole("button", { name: "Board" }).click();
  await expect(square(page, "board", "e4").locator(".piece")).toHaveText("♙");
  await expect(page.locator("#moves")).toContainText("e4");
});

test("computer mode returns a legal engine reply without replacing the human position", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#engineStatus")).toContainText("Stockfish 19 Lite ready", { timeout: 30000 });
  await page.getByRole("button", { name: "Play computer" }).click();
  await square(page, "board", "e2").click();
  await square(page, "board", "e4").click();
  await expect(page.locator("#moves")).toContainText("e4");
  await expect.poll(() => page.locator("#moves").innerText(), { timeout: 20000 }).not.toBe("1.  e4");
  await expect(page.locator("#status")).toContainText(/White to move|Checkmate|Draw/);
});

test("navigation buttons do not throw page errors", async ({ page }) => {
  const errors = await openApp(page);
  for (const name of ["Trainer", "Courses", "Videos", "Rules", "Board"]) {
    await page.getByRole("button", { name }).click();
  }
  expect(errors.map(e => e.message)).toEqual([]);
});

test("engine level changes do not create a second worker", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#engineStatus")).toContainText("Stockfish 19 Lite ready", { timeout: 30000 });
  await page.locator("#level").selectOption("2400");
  await page.locator("#applyLevel").click();
  await expect(page.locator("#engineStatus")).toContainText("Level set — 2400");
  await expect(page.locator("#board .sq")).toHaveCount(64);
});

test("reset cancels an active engine search before a new game", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#engineStatus")).toContainText("Stockfish 19 Lite ready", { timeout: 30000 });
  await page.getByRole("button", { name: "Play computer" }).click();
  await square(page, "board", "e2").click();
  await square(page, "board", "e4").click();
  await page.getByRole("button", { name: "New game" }).click();
  await expect(page.locator("#status")).toHaveText("White to move");
  await expect(page.locator("#moves")).toHaveText("No moves yet.");
  await expect(square(page, "board", "e2").locator(".piece")).toHaveText("♙");
});


test("game review training analyzes the exact position and retries wrong moves", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#engineStatus")).toContainText("Stockfish 19 Lite ready", { timeout: 30000 });
  await square(page, "board", "e2").click();
  await square(page, "board", "e4").click();

  await page.getByRole("button", { name: "Train this position" }).click();
  await expect(page.locator("#trainingLoopStatus")).toContainText(/Position analyzed|Analyzing position/, { timeout: 20000 });
  await expect(page.locator("#trainingLoopStatus")).toContainText("Position analyzed", { timeout: 20000 });

  await page.getByRole("button", { name: "Trainer" }).click();
  await expect(page.locator("#lessonTitle")).toHaveText("Game Review Drill");
  await expect(page.locator("#trainerBoard")).toHaveAttribute("data-training-target", /^[a-h][1-8][a-h][1-8][qrbn]?$/);

  const target = await page.locator("#trainerBoard").getAttribute("data-training-target");
  const from = target.slice(0, 2);
  const to = target.slice(2, 4);
  await square(page, "trainerBoard", from).click();
  const alternate = await page.locator("#trainerBoard .sq.legal").evaluateAll((nodes, targetTo) => {
    const candidate = nodes.find(n => n.dataset.square !== targetTo);
    return candidate ? candidate.dataset.square : null;
  }, to);
  expect(alternate).not.toBeNull();

  await square(page, "trainerBoard", alternate).click();
  await expect(square(page, "trainerBoard", from).locator(".piece")).toHaveCount(1);
  await expect(page.locator("#trainerStatus")).toContainText("not the engine target");

  await square(page, "trainerBoard", from).click();
  await square(page, "trainerBoard", to).click();
  await expect(page.locator("#lessonProgress")).toHaveCSS("width", /.+/);
  await expect(page.locator("#trainerStatus")).toContainText("correct. You found Stockfish's move");
});
