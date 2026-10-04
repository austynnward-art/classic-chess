import { GameState } from "../chess/game-state.js";
import { StorageRepository } from "../persistence/storage.js";
import { StockfishService } from "../engine/stockfish-service.js";
import { Router } from "./router.js";
import { courses } from "../content/courses.js";

export function createRebelApp({ root = document } = {}) {
  const storage = new StorageRepository();
  const game = new GameState();
  const engine = new StockfishService("./stockfish.js");

  const router = new Router({
    pages: ["home","board","courses","trainer","analysis","progress"],
    onChange: id => {
      root.dispatchEvent(new CustomEvent("rebel:navigate", { detail: id }));
    }
  });

  return { root, storage, game, engine, router, courses };
}

export async function bootRebelApp(options) {
  const app = createRebelApp(options);
  await app.engine.start();
  app.router.go("home");
  return app;
}
