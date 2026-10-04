# Rebel Classic Chess — v2 Architecture

## Source of truth
The `classic-chess` repository is the canonical source. v2 is a structural rebuild, not a second redesign layered onto the existing page.

## Principles
- One authoritative chess state per active workflow.
- UI components never own chess rules.
- Stockfish is accessed through one serialized engine service.
- Persistence is behind a storage repository.
- Courses, chapters, lessons, drills, and review reports are data models.
- Existing Playwright tests remain regression gates during migration.
- No Chessly proprietary source, assets, branding, or private implementation is copied; only publicly observable product patterns are used as inspiration.

## Target tree
```
src/
  app/
    router.js
    bootstrap.js
  chess/
    game-state.js
    board-controller.js
    notation.js
  engine/
    stockfish-service.js
  content/
    courses.js
    drills.js
  training/
    drill-session.js
    review-session.js
  persistence/
    storage.js
  ui/
    board-view.js
    shell-view.js
    course-view.js
    drill-view.js
    analysis-view.js
```

## Runtime flow
Play -> GameState -> ReviewSession -> StockfishService -> ReviewReport -> DrillSession -> Progress

Course -> CourseView -> GameState -> StockfishService

All workflows use the same chess-state and engine abstractions, but each workflow owns its own session object. This prevents course/trainer boards from mutating the live game.

## Migration order
1. Extract engine and persistence services.
2. Extract board/game state.
3. Extract content data.
4. Extract course/drill/review sessions.
5. Replace DOM wiring with feature views/router.
6. Move the visual shell into a dedicated layout.
7. Expand regression coverage.
8. Remove legacy inline implementation only after tests pass.

## Regression requirements
- 64-square board.
- Correct initial position.
- Click movement and drag movement.
- Flip.
- Independent course/trainer boards.
- Course progress persistence.
- Saved games.
- Stockfish cancellation/race safety.
- Review results tied to the correct position.
