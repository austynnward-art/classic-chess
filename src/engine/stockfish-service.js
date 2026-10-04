export class StockfishService {
  constructor(workerUrl) {
    this.workerUrl = workerUrl;
    this.worker = null;
    this.ready = false;
    this.generation = 0;
    this.queue = [];
    this.active = null;
    this.jobId = 0;
  }

  async start() {
    if (this.ready) return;
    const generation = ++this.generation;
    this.worker = new Worker(this.workerUrl);
    this.worker.onmessage = event => this.handleMessage(generation, String(event.data || ""));
    this.worker.onerror = () => this.restart();
    this.worker.postMessage("uci");
  }

  handleMessage(generation, line) {
    if (generation !== this.generation || !this.worker) return;

    if (line === "uciok") {
      this.worker.postMessage("setoption name Threads value 1");
      this.worker.postMessage("isready");
      return;
    }

    if (line === "readyok") {
      this.ready = true;
      this.runNext();
      return;
    }

    if (line.startsWith("bestmove")) {
      const bestMove = line.split(/\\s+/)[1] || "0000";
      const job = this.active;
      if (!job) return;
      this.active = null;
      clearTimeout(job.timer);
      if (job.generation === this.generation) job.resolve(bestMove);
      this.runNext();
    }
  }

  search(fen, { depth = 12, time = 1800 } = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: ++this.jobId,
        fen,
        depth,
        time,
        generation: this.generation,
        resolve,
        reject
      });
      this.runNext();
    });
  }

  runNext() {
    if (!this.ready || this.active || !this.queue.length || !this.worker) return;

    const job = this.queue.shift();
    job.generation = this.generation;
    this.active = job;

    try {
      this.worker.postMessage("position fen " + job.fen);
      this.worker.postMessage("go depth " + job.depth + " movetime " + job.time);
      job.timer = setTimeout(() => {
        if (this.active !== job) return;
        this.active = null;
        try { this.worker.postMessage("stop"); } catch {}
        job.reject(new Error("Stockfish search timed out"));
        this.runNext();
      }, job.time + 1500);
    } catch (error) {
      this.active = null;
      job.reject(error);
      this.restart();
    }
  }

  cancel() {
    this.queue.splice(0).forEach(job => job.reject(new Error("Search cancelled")));
    if (this.active) {
      clearTimeout(this.active.timer);
      this.active.reject(new Error("Search cancelled"));
      this.active = null;
    }
    if (this.worker) {
      try { this.worker.postMessage("stop"); } catch {}
    }
  }

  restart() {
    try { this.worker?.terminate(); } catch {}
    this.worker = null;
    this.ready = false;
    this.generation++;
    this.cancel();
  }

  destroy() {
    this.cancel();
    try { this.worker?.terminate(); } catch {}
    this.worker = null;
    this.ready = false;
    this.generation++;
  }
}
