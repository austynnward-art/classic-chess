import { GameState } from "../chess/game-state.js";

export class DrillSession {
  constructor(drill, engine) {
    this.drill = drill;
    this.engine = engine;
    this.state = new GameState(drill.fen);
    this.target = null;
    this.status = "Find the move first.";
  }

  async prepare() {
    this.status = "Analyzing position…";
    this.target = await this.engine.search(this.state.fen());
    this.status = "Position validated.";
    return this.target;
  }

  play(from, to, promotion = "q") {
    const move = this.state.move(from, to, promotion);
    if (!move) return { ok:false, reason:"illegal" };
    const played = move.from + move.to + (move.promotion || "");
    if (this.target && played !== this.target) {
      this.state.reset(this.drill.fen);
      this.status = "That move is legal, but it is not Stockfish's target.";
      return { ok:false, reason:"wrong", move };
    }
    this.status = "Correct — Stockfish confirms the best move.";
    return { ok:true, move };
  }
}
