# Rebel Classic Chess — v2 Architecture

## Source of truth
`classic-chess` is the canonical repository. v2 replaces the monolithic runtime rather than layering another redesign on top of it.

## Target runtime
```
AppShell
 ├─ Router
 ├─ GameState / BoardView
 ├─ CourseSession
 ├─ DrillSession
 ├─ ReviewSession
 ├─ AnalysisView
 ├─ StorageRepository
 └─ StockfishService
```

## Rules
- One authoritative GameState per workflow.
- No feature may mutate another feature's board.
- All engine requests pass through StockfishService.
- Engine generations invalidate stale results after reset, lesson changes, or cancellation.
- Content is data, not DOM.
- Persistence is accessed through StorageRepository.
- Existing Playwright tests remain regression gates.

## Cutover phases
1. Service extraction — complete on v2 branch.
2. Feature data/session extraction — complete on v2 branch.
3. App shell adapter — next.
4. Move board/course/trainer/analysis UI onto the services.
5. Add regression tests for the new module boundaries.
6. Run the complete browser suite.
7. Remove legacy inline runtime.
8. Merge v2 only after green regression coverage.
