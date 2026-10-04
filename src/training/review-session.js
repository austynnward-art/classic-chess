import { Chess } from "https://cdnjs.cloudflare.com/ajax/libs/chess.js/1.4.0/chess.min.js";

export class ReviewSession {
  constructor(startFen, moves, engine) {
    this.startFen = startFen;
    this.moves = moves;
    this.engine = engine;
    this.results = [];
    this.cancelled = false;
  }

  async run(onProgress = () => {}) {
    const replay = new Chess(this.startFen);
    for (let index = 0; index < this.moves.length; index++) {
      if (this.cancelled) throw new Error("Review cancelled");
      const move = replay.history({ verbose:true })[index] || null;
      const before = replay.fen();
      const applied = replay.move(this.moves[index]);
      if (!applied) continue;

      const best = await this.engine.search(before);
      const played = applied.from + applied.to + (applied.promotion || "");
      const classification = played === best ? "good" : "inaccuracy";
      const result = { ply:index+1, move:applied.san, played, best, classification, before, after:replay.fen() };
      this.results.push(result);
      onProgress(result, index + 1, this.moves.length);
    }
    return this.results;
  }

  cancel() {
    this.cancelled = true;
    this.engine.cancel();
  }
}
