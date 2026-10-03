const {test,expect}=require("@playwright/test");
const sq=(page,file,rank)=>page.locator('#board .sq[data-file="'+file+'"][data-rank="'+rank+'"]');
async function board(page){await page.goto("/");await expect(page.locator("#board .sq")).toHaveCount(64);}
test("loads the 8x8 board",async({page})=>{await board(page);await expect(page.locator("#board .pieceImg")).toHaveCount(32);await expect(page.locator("#status")).toContainText("White to move");});
test("click movement stays synchronized",async({page})=>{await board(page);await sq(page,"e",2).click();await expect(sq(page,"e",4)).toHaveClass(/legal/);await sq(page,"e",4).click();await expect(page.locator("#moves")).toContainText("e2-e4");await expect(sq(page,"e",4).locator("img")).toHaveCount(1);await expect(page.locator("#status")).toContainText("Black to move");});
test("drag movement uses the legal move path",async({page})=>{await board(page);await sq(page,"g",1).dragTo(sq(page,"f",3));await expect(page.locator("#moves")).toContainText("g1-f3");await expect(sq(page,"f",3).locator("img")).toHaveCount(1);await expect(sq(page,"g",1).locator("img")).toHaveCount(0);});
test("illegal drag leaves state unchanged",async({page})=>{await board(page);await sq(page,"e",2).dragTo(sq(page,"e",5));await expect(page.locator("#moves")).toHaveText("No moves yet");await expect(sq(page,"e",2).locator("img")).toHaveCount(1);await expect(sq(page,"e",5).locator("img")).toHaveCount(0);});
test("computer mode accepts a player move and returns control",async({page})=>{await board(page);await expect(page.locator("#engineState")).toContainText("Stockfish ready",{timeout:20000});await page.locator('[data-mode="computer"]').click();await sq(page,"e",2).dragTo(sq(page,"e",4));await expect(page.locator("#moves")).toContainText("e2-e4");await expect(page.locator("#status")).toContainText("Black to move");await expect.poll(()=>page.locator("#moves").innerText(),{timeout:20000}).not.toBe("e2-e4");await expect(page.locator("#status")).toContainText(/White to move|Game over/);});
test("trainer lesson selection and quiz flow works",async({page})=>{
  await page.goto("/");
  await page.locator('[data-page="learn"]').first().click();
  await expect(page.locator("#learn")).toHaveClass(/active/);
  await page.locator('.lesson[data-lesson="opening"]').click();
  await expect(page.locator("#lessonProgress")).toContainText("Opening plan");
  await page.locator("#learnQuiz").click();
  await expect(page.locator("#lessonQuizPanel")).toBeVisible();
  await expect(page.locator("#quizQuestions .quizQ")).toHaveCount(3);
  for(let i=0;i<3;i++) await page.locator('input[name="q'+i+'"][value="0"]').check();
  await page.locator("#quizSubmit").click();
  await expect(page.locator("#quizResult")).toContainText("Score 3/3");
  await expect(page.locator("#lessonProgress")).toContainText("3 quiz points");
});
test("academy course cards open the matching trainer lesson",async({page})=>{
  await page.goto("/");
  await page.locator('[data-page="courses"]').first().click();
  await expect(page.locator("#courses")).toHaveClass(/active/);
  await page.locator('[data-course="tactics"]').click();
  await expect(page.locator("#learn")).toHaveClass(/active/);
  await expect(page.locator("#lessonProgress")).toContainText("Forcing moves");
});
