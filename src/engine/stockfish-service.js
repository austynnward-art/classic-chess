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
    if (this.ready && this.worker) return;
    const generation = ++this.generation;
    const worker = new Worker(this.workerUrl);
    this.worker = worker;
    this.ready = false;
    worker.onmessage = event => this.handleMessage(worker, generation, String(event.data || ""));
    worker.onerror = () => {
      if (worker !== this.worker || generation !== this.generation) return;
      this.restart();
    };
    worker.postMessage("uci");
  }

  handleMessage(worker, generation, line) {
    if (worker !== this.worker || generation !== this.generation) return;

    if (line === "uciok") {
      worker.postMessage("setoption name Threads value 1");
      worker.postMessage("isready");
      return;
    }

    if (line === "readyok") {
      this.ready = true;
      this.runNext();
      return;
    }

    if (line.startsWith("bestmove")) {
      const job = this.active;
      if (!job || job.generation !== generation) return;
      const bestMove = line.split(/\s+/)[1] || "0000";
      this.active = null;
      clearTimeout(job.timer);
      job.resolve(bestMove);
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
    // Invalidate every response already in flight before accepting a replacement job.
    this.generation++;
    const queued = this.queue.splice(0);
    queued.forEach(job => job.reject(new Error("Search cancelled")));

    const active = this.active;
    this.active = null;
    if (active) {
      clearTimeout(active.timer);
      active.reject(new Error("Search cancelled"));
    }

    if (this.worker) {
      try { this.worker.postMessage("stop"); } catch {}
    }
  }

  restart() {
    const oldWorker = this.worker;
    this.worker = null;
    this.ready = false;
    this.generation++;
    try { oldWorker?.terminate(); } catch {}

    const queued = this.queue.splice(0);
    queued.forEach(job => job.reject(new Error("Engine restarted")));

    const active = this.active;
    this.active = null;
    if (active) {
      clearTimeout(active.timer);
      active.reject(new Error("Engine restarted"));
    }
  }

  destroy() {
    this.cancel();
    const worker = this.worker;
    this.worker = null;
    this.ready = false;
    this.generation++;
    try { worker?.terminate(); } catch {}
  }
}
