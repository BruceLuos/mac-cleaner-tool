# Architecture (as-built)

This describes what was **actually built** for v1, including where it diverged from the
[implementation plan](plans/2026-07-07-mac-cleaner-tool-implementation-plan.md). The plan is
the historical record; this document is the living truth.

## Design principle

Cleanup logic is kept **Electron-free** so a future Tauri migration is realistic. The engine
depends only on Node built-ins and injected capabilities; Electron appears only in the IPC
layer and in `trash.ts` (which provides the production capabilities).

## Layered structure

```
src/
  shared/cleanup-types.ts          # Cross-process contracts (no runtime deps)
  main/
    index.ts                       # Electron main: window + IPC handlers
    cleanup/
      registry.ts                  # Policy: the white-list of targets + bilingual copy
      path-utils.ts                # ~ expansion, existence checks
      scanner.ts                   # Read-only size measurement (path + command modes)
      cleaner.ts                   # Trash-first orchestration, deps injected
      trash.ts                     # Production CleanerDeps: shell.trashItem + child_process
      controller.ts                # Ties registry + scanner + cleaner for the IPC layer
  preload/
    index.ts                       # Narrow typed bridge -> window.macCleaner
    index.d.ts                     # MacCleanerAPI type declaration
  renderer/
    App.tsx                        # State machine: scan -> select -> clean -> log
    i18n/
      messages.ts                  # Pure STRINGS + translate() + bi()
      context.ts                   # createContext + useI18n hook
      I18nProvider.tsx             # Provider component only
    features/
      categories.ts                # Category order + label-key mapping
      selectors.ts                 # Pure aggregation (category totals, grand total)
      dashboard/
        Dashboard.tsx              # Header summary + scan + category grid + lang toggle
        CategoryCard.tsx           # One category card
        DetailDrawer.tsx           # Per-target list with checkboxes + clean actions
      logs/
        OperationLog.tsx           # Bilingual, level-colored operation log
    lib/format.ts                  # Locale-aware byte formatting
```

## Process boundaries

- **Main** owns all filesystem access and command execution. IPC channels:
  `cleanup:registry` (returns the white-list), `cleanup:scan` (read-only measure),
  `cleanup:clean` (executes only the targets the renderer passes).
- **Preload** exposes exactly three methods via `window.macCleaner`:
  `getRegistry()`, `scan()`, `cleanSelected(targets)`. No raw `fs`/`shell` leaks through.
- **Renderer** is UI-only. It never imports `electron` or `fs`; it builds
  `CleanupExecutionTarget` payloads from scan results + registry and hands them back.

## Data flow

1. Mount → renderer calls `getRegistry()` to load target definitions.
2. **Scan** → `scan()` measures every white-listed target (read-only).
   - Path mode: expand `~`, check existence, recursive directory size.
   - Command mode: probe the binary on `PATH`; size is discovered at clean time, not measured.
3. Dashboard aggregates results per category (`selectors.ts`) and shows a grand total.
4. User opens a category drawer, ticks targets, clicks **Clean Selected**.
5. Renderer maps selected ids → `CleanupExecutionTarget[]` (resolving paths/commands) and calls
   `cleanSelected()`.
6. Cleaner runs each target; trash mode moves every resolved path to Trash, command mode runs
   the registered command. Each target yields its own result — one failure never aborts the batch.
7. Renderer writes bilingual log entries (`bi()` produces both languages so they survive a
   locale switch) and triggers a re-scan of affected state.

## Key divergences from the plan

These are intentional improvements made during implementation; the plan was not updated in place.

- **i18n split into three files** (`messages.ts` / `context.ts` / `I18nProvider.tsx`). The plan
  assumed one module. Splitting satisfies `react-refresh/only-export-components` (a component
  file may not also export hooks/constants) and gives a pure `translate()`/`bi()` usable outside
  React — needed to persist bilingual operation-log entries.
- **`controller.ts` added.** Keeps `main/index.ts` thin: IPC handlers delegate to
  `getRegistry`/`scanAll`/`clean`, so the orchestration of registry+scanner+cleaner is testable
  and Electon-glue-free.
- **Dependency injection in the cleaner.** `cleanSelectedTargets(items, deps)` takes
  `moveToTrash`/`runCommand` as injected capabilities. `trash.ts` is the only place Electron and
  `child_process` appear, so the cleaner is fully unit-testable without an Electron runtime.
- **Registry expanded** beyond one-entry-per-category to cover the design's MVP breadth: npm,
  pip, Homebrew downloads, Playwright (developer); Chrome, Edge (browsers); Sparkle, ShipIt
  (app updates); Docker `builder prune` (docker). Docker carries a real `command` field —
  without it a command-mode target would always scan as "not found".
- **Scanner concurrency fix.** The first `sizeOnDisk` accumulated into a shared counter across
  concurrent `await`s (`total += await ...`), which loses updates. It now collects sizes via
  `Promise.all` then reduces — caught by a nested-directory unit test.

## Safety boundary (enforced in code, not just docs)

- Only `cleanupRegistry` entries are scannable/cleanable — there is no free-form-path API.
- `cleanSelected` receives pre-resolved paths from scan results; the renderer cannot inject
  arbitrary paths the scanner never validated (it can only echo back paths the main process
  itself resolved).
- Trash-first: `shell.trashItem` is the default and only delete path in v1. No `rm -rf` anywhere.
- Missing / inaccessible / in-use targets are skipped with a logged reason, never silently
  dropped or retried destructively.

## Testing

- **Unit** (`vitest`, node env): registry category coverage, scanner (existing / missing /
  nested with the concurrency guard), cleaner (trash success/skip/fail + command mode).
- **Component** (`vitest` + jsdom + Testing Library): App renders the four category cards and
  toggles zh↔en labels.
- **Manual**: see [manual-test-checklist.md](manual-test-checklist.md) for the per-category
  scan/clean/log matrix owed for each release.
