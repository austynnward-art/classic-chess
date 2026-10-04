import { START_FEN, GameState } from "../chess/game-state.js";

export class BoardView {
  constructor({ state = new GameState(), engine = null, interactive = true } = {}) {
    this.state = state;
    this.engine = engine;
    this.interactive = interactive;
    this.flipped = false;
    this.root = null;
    this.status = "";
    this.onMove = null;
  }

  mount(root) {
    this.root = root;
    this.render();
    return this;
  }

  render() {
    if (!this.root) return;
    const files = this.flipped ? ["h","g","f","e","d","c","b","a"] : ["a","b","c","d","e","f","g","h"];
    const ranks = this.flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
    const pieceMap = {wp:"♙",wn:"♘",wb:"♗",wr:"♖",wq:"♕",wk:"♔",bp:"♟",bn:"♞",bb:"♝",br:"♜",bq:"♛",bk:"♚"};
    const squares = [];
    for (const rank of ranks) for (const file of files) {
      const square = file + rank;
      const piece = this.state.chess.get(square);
      const key = piece ? piece.color + piece.type : "";
      const selected = this.state.selected === square ? " selected" : "";
      squares.push('<button class="rebel-square' + selected + '" data-square="' + square + '" aria-label="' + square + '">' + (pieceMap[key] || "") + "</button>");
    }
    this.root.innerHTML = '<div class="rebel-board" role="grid">' + squares.join("") + '</div>' +
      '<div class="rebel-board-controls"><button data-action="flip">Flip board</button><button data-action="reset">New position</button></div>' +
      '<div class="rebel-board-status">' + (this.status || (this.state.turn() === "w" ? "White" : "Black") + " to move") + "</div>";
    this.root.querySelectorAll("[data-square]").forEach(b => b.addEventListener("click", () => this.click(b.dataset.square)));
    this.root.querySelector('[data-action="flip"]').addEventListener("click", () => { this.flipped = !this.flipped; this.render(); });
    this.root.querySelector('[data-action="reset"]').addEventListener("click", () => { this.state.reset(); this.status = ""; this.render(); });
  }

  click(square) {
    if (!this.interactive) return;
    if (this.state.selected) {
      const from = this.state.selected;
      const move = this.state.move(from, square);
      if (move) {
        this.status = "";
        this.onMove?.(move);
        this.render();
        return move;
      }
    }
    this.state.select(square);
    this.render();
    return null;
  }

  setPosition(fen = START_FEN) {
    this.state.reset(fen);
    this.status = "";
    this.render();
  }
}
