@AGENTS.md

# Game Implementation Requirements

Every game in Phase 3+ MUST follow all requirements below. These survive context compaction.

## Shared hooks (no re-implementing logic they provide)

- Use `useSessionResult` — provides personalBest, prevSessionResult, isNewRecord
- Use `useStorage` (via `StorageContext`) — never touch localStorage directly
- Use `useReducedMotion` — combines app setting + prefers-reduced-motion; no separate motion logic

## Pure reducer + injectable clock

- All game state lives in a pure reducer (no Date/Math.random/setTimeout inside)
- All stimulus timing goes through the scheduler pattern with a `Clock` interface
- Schedulers are created with `createXxxScheduler(clock)` and accept a fake clock in tests
- `realClock` is exported from `src/lib/scheduler/types.ts`

## Pause in all active phases

- PAUSE must work from: `ready`, `preview`, `input`, `feedback`
- PAUSE is a no-op from: `idle`, `result`, `paused`
- On RESUME → go to `ready` (fresh stimulus, never resume mid-sequence)
- The scheduler's `stop()` is called from the preview/sequence useEffect cleanup
- Unit tests must cover PAUSE from every active phase and RESUME

## Session saving

- Sessions are saved by `useSessionResult` when phase === "result"
- QUIT dispatches `QUIT` → phase becomes `"idle"` (NOT `"result"`) — no session is saved
- Save-guard: sessions with `round === 0` are skipped (in useSessionResult, not the reducer)
- Sessions where rounds were played but none correct ARE saved

## Required game features

- Tutorial: show on first play (`showTutorial` flag), skip on subsequent plays
- "About this exercise" panel in EN/RU/HE (via ResultScreen's `about` prop)
- No hardcoded strings — everything via `useTranslations()`; includes aria labels
- Keyboard playable (arrow keys, Space/Enter, digit keys as appropriate)

## No answer data in production DOM

- `data-sequence`, `data-pattern`, `data-digits` (or equivalent) attributes are only rendered when `process.env.NEXT_PUBLIC_E2E === "1"`
- The Playwright webServer sets `NEXT_PUBLIC_E2E=1` in its command
- Verify with a production build that attributes are absent

## E2E requirements

- Each game has a full-round E2E test that reads the answer from a `data-*` attribute and enters it correctly
- Full-round test asserts `"Correct!"` (exact string), not a regex like `/Correct!|Incorrect/`
- Pause/quit tests wait for the game board to appear (not for `data-pauseable`)

## Reporting

After implementing each game, report:
1. Raw `vitest run --coverage` output for that game's test files
2. Raw `next build` output (no errors)
3. Raw Playwright output for that game's spec

Stop and wait for reply before starting the next game.
