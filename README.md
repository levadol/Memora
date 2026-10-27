# Memora

Cognitive training web app with five memory games and three mental arithmetic games. Sessions take 1–3 minutes per game. Track progress over time, earn streak rewards, and complete separate daily training queues for memory and arithmetic.

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Vitest unit tests |
| `npm run test:coverage` | Tests with v8 coverage table |
| `npm run test:tz` | Run tests twice: `TZ=UTC` then `TZ=Asia/Jerusalem` (streak timezone) |
| `npx playwright test` | E2E tests (auto-starts dev server) |
| `npx playwright test --ui` | Playwright interactive mode |

## E2E flag

`NEXT_PUBLIC_E2E=1` renders `data-sequence`, `data-pattern`, and `data-pa-correct-word` attributes so tests can read the correct answer and submit it programmatically. The Playwright `webServer` config already sets this flag; never set it in a production build.

> **E2E tests** must be run via `npx playwright test`, never against a manually-started dev server. The test runner starts its own server with `NEXT_PUBLIC_E2E=1`; running against a server without that flag disables all data attributes that drive E2E assertions.

## Architecture

```
src/
  app/[locale]/        # Next.js App Router pages (home, statistics, settings)
  components/
    games/             # Eight game UIs + shared shell, result screen, tutorial overlay
    layout/            # Header, BackgroundBlobs
    ui/                # GlassCard, GlassButton, ProgressRing, SVGLineChart, AchievementToast
  lib/
    games/             # Pure reducers + schedulers per game (no React, no DOM)
    hooks/             # useSessionResult, useReducedMotion, useDailyTraining
    scheduler/         # Injectable Clock pattern; realClock for production
    storage/           # StorageAdapter interface + LocalStorageAdapter
    store/             # Zustand store (UI state, daily training, achievements)
    streak.ts          # Timezone-aware streak computation
    achievements.ts    # Achievement evaluation
  test/                # Vitest unit tests
messages/              # i18n: en.json, ru.json, he.json
e2e/                   # Playwright E2E tests
```

### Key patterns

- **Pure reducer + injectable clock**: all game logic lives in a pure reducer (`src/lib/games/<name>/logic.ts`). Timing goes through a `Clock` interface so tests use a fake clock with zero wall time.
- **StorageAdapter**: all persistence behind an interface (`src/lib/storage/types.ts`). Swap `LocalStorageAdapter` for a remote backend without touching game code.
- **Daily training**: Two independent Zustand state machines — memory (`dailyQueue`, `dailyProgress`, `dailySummary`) and arithmetic (`arithmeticDailyQueue`, `arithmeticDailyProgress`, `arithmeticDailySummary`) — each persisted to localStorage keyed by local date. A new calendar day resets both automatically.
- **Streak**: `computeStreak(sessions, now, timeZone?)` accepts an explicit IANA timezone so tests are deterministic regardless of the test runner's `TZ` environment variable.
- **Theme before first paint**: an inline `<script>` in `[locale]/layout.tsx` reads `localStorage` and sets `html.light` synchronously, preventing a dark flash for light-theme users.

## Difficulty Picker

Each game shows a full-screen difficulty picker before starting. The three levels adapt automatically within a session:

| Game | Easy | Medium | Hard |
|---|---|---|---|
| Arithmetic Blitz | Single-digit add/sub | Two-digit mix | Multiply/divide |
| Arithmetic Chain | Short chains, slow | Medium chains | Long chains, fast |
| True or False | 5s per item | 4s per item | 3s per item |

Keyboard shortcuts: `1`/`2`/`3` select a difficulty; `Enter` confirms; `Escape` goes back. Within each difficulty, the app adapts sub-levels (3 consecutive correct → advance; 2 consecutive wrong → retreat).

## Adding a sixth game

1. Create `src/lib/games/<name>/` with `logic.ts` (pure reducer), `types.ts`, `constants.ts`, `tutorial.ts`.
2. Create `src/components/games/<name>/<Name>Game.tsx`.
3. Add `"<name>"` to `GameId` in `src/lib/storage/types.ts`.
4. Register in `src/components/games/shared/GameOverlay.tsx` switch statement.
5. Add a card to `GAMES` in `src/app/[locale]/page.tsx` and to `DAILY_GAMES` in `src/lib/store/index.ts`.
6. Add the game to the statistics page `GAME_SECTIONS` array.
7. Add message keys to all three `messages/*.json` files (name, description, about panel).
8. If the game needs word lists, add per-locale files following the `src/content/paired-associates/` pattern (e.g. `words-en.json`, `words-ru.json`, `words-he.json`).
9. Write unit tests and a Playwright E2E spec.

## Editing word lists

Paired Associates word lists live in `src/content/paired-associates/`:

| File | Locale |
|---|---|
| `words-en.json` | English |
| `words-ru.json` | Russian |
| `words-he.json` | Hebrew |

Each is a `string[]` JSON array of common nouns. Target 80+ words per locale. A hard-mode session with 6 rounds can use up to 50 unique words (6+7+8+9+10+10 = 50, worst case all-correct from hard starting point); the current 64-icon pool and word lists both comfortably exceed that.

## Scientific basis of each game

### Digit Span
Based on the Wechsler digit span subtest (Wechsler, 1939 — to be verified). Measures verbal short-term memory capacity. Forward span averages 7±2 items (Miller, 1956 — to be verified). Backward span requires active working memory manipulation. Practice reliably improves task performance; transfer to general working memory is limited (Melby-Lervåg et al., 2016 — to be verified).

### Corsi Block Tapping
Corsi developed the block-tapping task in Milner's lab; Milner (1971 — to be verified) described it. Measures visuospatial short-term memory. Typical span: 5–6 blocks. Dissociates from verbal short-term memory. Same caveats on transfer apply.

### N-Back
Kirchner (1958 — to be verified). Measures working memory updating. Jaeggi et al. (2008 — to be verified) claimed far transfer to fluid intelligence; meta-analyses disagree — Melby-Lervåg & Hulme (2013 — to be verified) found weak or no effect, while Au et al. (2015 — to be verified) reported a small positive effect.

### Pattern Matrix
Visuospatial working memory; analogous to spatial n-back or matrix reasoning. Used in standardized batteries (e.g., CANTAB — to be verified). Practice improves the trained task; generalization to novel visual patterns is debated.

### Paired Associates
Based on the WMS-R paired-associate learning subtest (Wechsler, 1987 — to be verified). Measures associative and episodic memory encoding and retrieval. Training on abstract symbol–word pairs improves task performance; evidence for broader memory benefit is limited.

### Arithmetic Blitz
Based on mental arithmetic research linking numerical fluency to working memory capacity and executive function (Hitch, 1978 — to be verified; Ashcraft & Stazyk, 1981 — to be verified). Timed arithmetic tasks are used as measures of processing speed in cognitive assessments. Practice reliably improves mental calculation speed; transfer to general mathematical ability is debated.

### Arithmetic Chain
Based on complex-span and updating paradigms used in working memory research. Requires simultaneous storage and processing of running totals, placing heavy demands on the central executive (Baddeley & Hitch, 1974 — to be verified). Consistent practice improves performance on similar mental arithmetic tasks; transfer to general working memory capacity is not established.

### True or False
Based on arithmetic verification tasks widely used in cognitive psychology. Verification speed correlates with working memory capacity and numerical fluency (Zbrodoff & Logan, 2005 — to be verified). Trains inhibitory control under time pressure. Practice improves verification speed; transfer to general mathematical ability remains under investigation.

**None of these games raise IQ, prevent dementia, or improve general intelligence. They reliably improve performance on the trained tasks. Transfer to everyday cognitive abilities is actively debated in the scientific literature.**
