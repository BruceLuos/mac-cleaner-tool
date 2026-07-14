# Mac Cleaner Tool

A safety-first macOS cleanup utility for personal use. It scans a **white-listed** set of
developer / browser / app-updater / Docker cache targets, shows what can be reclaimed, and
moves **only the items you manually select** to Trash (recoverable until you empty Trash).

> v1 never deletes permanently, never accepts free-form paths, and only cleans targets you
> explicitly tick. Design spec: [`docs/specs/2026-07-07-mac-cleaner-tool-design.md`](docs/specs/2026-07-07-mac-cleaner-tool-design.md).

## Requirements

- macOS (Apple Silicon or Intel)
- Node.js 20+ and [pnpm](https://pnpm.io)

## Project Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev      # launch the Electron app with hot reload
```

## Quality gates

```bash
pnpm typecheck   # tsc for main + renderer
pnpm lint        # eslint
pnpm test        # vitest unit + component tests
pnpm build       # typecheck + production build (out/)
```

## Package a macOS `.app`

```bash
pnpm build:mac
```

Artifacts land in `dist/` (`.app`, `.dmg`, and a `-arm64`/`-x64` zip). The build is unsigned
and notarization is off (`notarize: false`) — for local personal use only. On first launch,
right-click → **Open** to bypass Gatekeeper, or run `xattr -dr com.apple.quarantine /path/to.app`.

## Architecture

The cleanup engine is deliberately decoupled from Electron so a future Tauri migration stays
realistic:

```
src/
  shared/cleanup-types.ts        # cross-process contracts (registry, scan, clean, log)
  main/
    index.ts                     # Electron main + IPC handlers (cleanup:registry|scan|clean)
    cleanup/
      registry.ts                # Policy: white-listed targets + bilingual copy
      scanner.ts / path-utils.ts # read-only size measurement
      cleaner.ts                 # trash-first orchestration (Electron-free, deps injected)
      trash.ts                   # production deps: shell.trashItem + child_process
      controller.ts              # ties registry + scanner + cleaner for IPC
  preload/index.ts               # narrow typed bridge -> window.macCleaner
  renderer/
    App.tsx                      # state machine: scan -> select -> clean -> log
    i18n/                        # messages.ts (pure) · context.ts (hook) · I18nProvider.tsx
    features/dashboard/          # header, category cards, detail drawer
    features/logs/               # operation log
    lib/format.ts                # locale-aware byte formatting
```

### Data flow

1. App loads the registry via `window.macCleaner.getRegistry()`.
2. **Scan** → `scan()` measures each white-listed target (read-only).
3. Dashboard aggregates totals per category; open a card to see per-target details.
4. Tick targets → **Clean Selected** → `cleanSelected(targets)` moves them to Trash
   (or runs a registered command like `docker builder prune`).
5. Operation log records every attempt, skip, success, and failure with a reason.

## Safety model

- Only registry-defined targets are ever scanned or cleaned — no free-form paths in v1.
- Every item carries a risk label (`safe` / `caution`) and a bilingual explanation.
- Cleanup requires explicit manual selection and a confirmation prompt.
- Trash-first: items go to Trash and stay recoverable until you empty it.
- Missing / inaccessible / in-use targets are skipped with a logged reason, not silently dropped.

## Local settings

The app stores the selected locale, enabled categories, and selected target IDs locally in
Electron's user-data directory (`settings.json`). It never stores cleanup paths or commands.
If the file is missing or corrupted, the app falls back to Chinese, all categories enabled, and
no selected targets. Settings persistence failures do not block scanning or cleaning.

## License

Personal use.
