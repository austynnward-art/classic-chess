import { GameState } from "../chess/game-state.js";
import { StorageRepository } from "../persistence/storage.js";
import { StockfishService } from "../engine/stockfish-service.js";
import { Router } from "./router.js";
import { courses } from "../content/courses.js";

const DEFAULT_ENGINE_URL = "https://cdn.jsdelivr.net/gh/nmrugg/stockfish.js@v19.0.0/src/stockfish-19-lite-single.js";

export function createRebelApp({ root = document, workerUrl = DEFAULT_ENGINE_URL } = {}) {
  const storage = new StorageRepository();
  const game = new GameState();
  const engine = new StockfishService(workerUrl);

  const router = new Router({
    pages: ["home","board","courses","trainer","analysis","progress"],
    onChange: id => root.dispatchEvent(new CustomEvent("rebel:navigate", { detail: id }))
  });

  return { root, storage, game, engine, router, courses };
}

export async function bootRebelApp(options) {
  const app = createRebelApp(options);
  try {
    await app.engine.start();
  } catch (error) {
    app.engineError = error;
  }
  return app;
}
