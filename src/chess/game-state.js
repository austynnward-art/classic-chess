import { Chess } from "https://cdnjs.cloudflare.com/ajax/libs/chess.js/1.4.0/chess.min.js";

export const START_FEN = new Chess().fen();

export class GameState {
  constructor(fen = START_FEN) {
    this.chess = new Chess(fen);
    this.selected = null;
  }

  reset(fen = START_FEN) {
    this.chess = new Chess(fen);
    this.selected = null;
    return this;
  }

  select(square) {
    const piece = this.chess.get(square);
    if (piece && piece.color === this.chess.turn()) {
      this.selected = square;
      return true;
    }
    this.selected = null;
    return false;
  }

  move(from, to, promotion = "q") {
    try {
      const move = this.chess.move({ from, to, promotion });
      if (!move) return null;
      this.selected = null;
      return move;
    } catch {
      return null;
    }
  }

  legalMoves(square = this.selected) {
    if (!square) return [];
    return this.chess.moves({ square, verbose: true });
  }

  fen() {
    return this.chess.fen();
  }

  history(options) {
    return this.chess.history(options);
  }

  turn() {
    return this.chess.turn();
  }
}
