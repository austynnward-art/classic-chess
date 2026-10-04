const PREFIX = "rebel:";

export class StorageRepository {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  games() {
    return this.get("games", []);
  }

  saveGame(game) {
    const games = [game, ...this.games()].slice(0, 100);
    this.set("games", games);
    return games;
  }

  progress() {
    return this.get("progress", {
      xp: 0,
      lessons: 0,
      games: 0,
      analysis: 0,
      tactics: 0,
      openings: 0
    });
  }

  updateProgress(patch) {
    const next = { ...this.progress(), ...patch };
    this.set("progress", next);
    return next;
  }
}
