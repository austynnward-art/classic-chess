const { test, expect } = require("@playwright/test");

const FAKE_WORKER = `
class FakeWorker {
  static instances = [];
  constructor() {
    this.messages = [];
    this.terminated = false;
    FakeWorker.instances.push(this);
  }
  postMessage(message) {
    this.messages.push(message);
    if (message === "uci") queueMicrotask(() => this.onmessage?.({data:"uciok"}));
    if (message === "isready") queueMicrotask(() => this.onmessage?.({data:"readyok"}));
  }
  terminate() { this.terminated = true; }
  emit(line) { this.onmessage?.({data:line}); }
}
globalThis.Worker = FakeWorker;
globalThis.__fakeWorkers = FakeWorker.instances;
`;

async function loadService(page) {
  return page.evaluate(async () => {
    const mod = await import("/src/engine/stockfish-service.js?test=" + Date.now());
    return mod.StockfishService;
  });
}

test("cancellation invalidates the old worker before replacement search", async ({ page }) => {
  await page.addInitScript({content: FAKE_WORKER});
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { StockfishService } = await import("/src/engine/stockfish-service.js?race=1");
    const service = new StockfishService("/fake-stockfish.js");
    await service.start();
    const oldWorker = globalThis.__fakeWorkers[0];

    const first = service.search("start", {depth:8, time:100});
    await new Promise(r => setTimeout(r, 0));
    service.cancel();

    let firstRejected = false;
    await first.catch(() => { firstRejected = true; });

    const replacement = service.search("replacement", {depth:8, time:100});
    await new Promise(r => setTimeout(r, 0));
    const newWorker = globalThis.__fakeWorkers[1];

    oldWorker.emit("bestmove e2e4");
    await new Promise(r => setTimeout(r, 10));

    const pendingAfterStale = await Promise.race([
      replacement.then(() => "resolved"),
      new Promise(r => setTimeout(() => r("pending"), 20))
    ]);

    newWorker.emit("bestmove d2d4");
    const finalMove = await replacement;

    return {
      firstRejected,
      oldTerminated: oldWorker.terminated,
      workerCount: globalThis.__fakeWorkers.length,
      pendingAfterStale,
      finalMove
    };
  });

  expect(result.firstRejected).toBe(true);
  expect(result.oldTerminated).toBe(true);
  expect(result.workerCount).toBe(2);
  expect(result.pendingAfterStale).toBe("pending");
  expect(result.finalMove).toBe("d2d4");
});

test("queued searches are serialized and each result belongs to its own generation", async ({ page }) => {
  await page.addInitScript({content: FAKE_WORKER});
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { StockfishService } = await import("/src/engine/stockfish-service.js?queue=1");
    const service = new StockfishService("/fake-stockfish.js");
    await service.start();
    const worker = globalThis.__fakeWorkers[0];

    const first = service.search("one", {depth:8, time:100});
    const second = service.search("two", {depth:8, time:100});
    await new Promise(r => setTimeout(r, 0));

    worker.emit("bestmove a2a3");
    const firstMove = await first;
    const secondStarted = worker.messages.some(x => x === "position fen two");

    worker.emit("bestmove b2b3");
    const secondMove = await second;

    return { firstMove, secondMove, secondStarted, workerCount: globalThis.__fakeWorkers.length };
  });

  expect(result.firstMove).toBe("a2a3");
  expect(result.secondMove).toBe("b2b3");
  expect(result.secondStarted).toBe(true);
  expect(result.workerCount).toBe(1);
});
