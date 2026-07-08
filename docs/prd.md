# Mac Cleaner Tool — Product Requirements (v1)

> **Provenance:** This is the original PRD produced during requirements brainstorming (formerly
> the Trellis task `07-07-mac-cleaner-tool/prd.md`), moved into the project so it is
> self-contained. v1 has shipped — the acceptance criteria below are ticked to reflect that.
> The durable design intent lives in [specs/2026-07-07-mac-cleaner-tool-design.md](specs/2026-07-07-mac-cleaner-tool-design.md);
> the as-built reality in [architecture.md](architecture.md).

## Goal

Build a standalone Mac cleanup utility for bruceluo that can inspect disk usage, identify
safe-to-clean cache and temporary data across common apps and developer tooling, and optionally
execute cleanup actions from a user-friendly local tool under the user's develop area.

## What I already knew

- The user wants a Mac cleanup tool created for personal use.
- The requested scope is broad: "as comprehensive as possible."
- The user wants the tool placed under `/Users/bruceluo/Desktop/Developer`.
- The current machine is a Mac with common developer and consumer apps installed, including
  Docker, VS Code, Cursor, Chrome, WeChat, Discord, Notion, Homebrew, npm, pnpm, pip, and
  Playwright caches.
- The user is interested in making the tool a desktop application.

## Assumptions (temporary)

- The first version should prioritize safe cleanup targets and clear dry-run visibility over
  aggressive deletion.
- A desktop app is likely the preferred direction unless the user later chooses a simpler
  CLI-first MVP.

## Open Questions

- None. Design approved and ready for spec review.

## Requirements

- The tool should run locally on macOS.
- The tool should help inspect and clean caches from common apps and development tools.
- The tool should be broad in coverage, but still distinguish safer cleanup targets from
  riskier ones.
- The tool should live under `/Users/bruceluo/Desktop/Developer`.
- The tool should support a desktop-app experience.
- V1 should use Electron.
- The architecture should leave room for a future migration to Tauri if desired.
- V1 MVP should prioritize a safe cleanup scope.
- V1 MVP should focus on high-value, lower-risk targets such as developer caches, browser
  caches, app updater leftovers, and Docker cleanup targets.
- V1 MVP should support scan-first workflows with manual item selection for cleanup.
- V1 should support both local development run and packaged `.app` delivery.
- V1 should support bilingual Chinese and English UI copy.
- V1 should use a dashboard + detail drawer product structure.
- V1 cleanup actions should prefer moving targets to Trash instead of permanently deleting them.

## Acceptance Criteria

- [x] The tool can scan common cache locations on this Mac and report size by category/path.
- [x] The tool can separate safe cleanup candidates from cautionary targets.
- [x] The tool can execute cleanup actions intentionally rather than deleting blindly.
- [x] The tool is created in the user-confirmed target directory.
- [x] The v1 UI only includes the agreed safe-priority cleanup categories.
- [x] The v1 UI supports manual selection of cleanup items instead of automatic one-click deletion.
- [x] The project can be run locally during development and can also produce a packaged macOS app artifact.
- [x] The v1 UI can present core copy in Chinese and English.
- [x] The v1 main experience uses a dashboard overview with drill-down details for category inspection and cleanup selection.
- [x] Selected cleanup items are sent to Trash in v1 instead of being permanently deleted.

## Definition of Done (team quality bar)

- Tests added/updated where practical
- Lint / typecheck green where applicable
- Docs/notes updated for usage and safety
- Risky cleanup paths clearly marked

## Decision (ADR-lite)

**Context:** The user wants a desktop application. Common feasible choices were Electron,
Tauri, or a lighter shell around a local web UI. The local machine already has working Node and
pnpm, but its Rust toolchain is currently broken, which blocks practical Tauri development today.

**Decision:** Build v1 as an Electron desktop app and preserve a migration path to Tauri later
if smaller packaging/runtime becomes important. (See [ADR 0001](decisions/0001-electron-over-tauri.md).)

**Consequences:**

- Faster path to a usable desktop tool now.
- Larger runtime footprint in v1.
- Keep cleanup/scanning logic separated from Electron UI glue so future migration is easier.
- Recovery is safer in v1, but some cleanup targets may free space only after Trash is emptied.

## Out of Scope (explicit)

- Blind deletion of arbitrary system files
- Kernel/system optimization beyond ordinary user-space cleanup
- Broader cleanup categories like downloads management, general large-file hunting, and deep
  system cleanup in v1
- One-click auto-clean of all safe items in v1
- Permanent delete as the default cleanup behavior in v1

## Technical Notes

- Project home: `/Users/bruceluo/Desktop/Developer/mac-cleaner-tool`
- Initial environment observations show large cleanup opportunities in `~/Library/Caches`,
  `~/.npm`, `~/.cache`, browser caches, updater leftovers, and Docker-related data.
- Research reference: [`research/desktop-framework-options.md`](research/desktop-framework-options.md)
