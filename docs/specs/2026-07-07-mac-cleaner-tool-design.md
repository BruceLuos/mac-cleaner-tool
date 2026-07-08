# Mac Cleaner Tool Design

## Goal

Build a personal macOS desktop cleanup tool under `/Users/bruceluo/Desktop/Developer` that scans high-value cache locations, presents results in a safe bilingual UI, and lets the user manually select items to move to Trash.

## MVP Scope

The first version is intentionally safety-first.

Included categories:

- Developer caches: `npm`, `pnpm`, `pip`, `Homebrew`, `Playwright`, similar cache directories
- Browser caches: Chrome-family cache directories
- App update leftovers: `ShipIt`, `Sparkle`, similar updater residue
- Docker cleanup targets: safe cache-oriented cleanup surfaced through known commands or directories

Included behavior:

- Scan known white-listed targets only
- Show category totals and per-path drill-down details
- Allow manual item selection for cleanup
- Move selected items to Trash instead of permanently deleting them
- Show action results and skipped items in an operation log
- Support Chinese and English UI copy
- Support both local development run and packaged `.app` output

Out of scope for v1:

- Full-disk large-file hunting
- Download-folder cleanup workflows
- Trash emptying automation
- One-click auto-clean of all safe items
- Permanent delete as the default path
- Deep system cleanup or arbitrary directory deletion

## Product Structure

The app uses a dashboard plus detail drawer layout.

Main dashboard:

- Header summary with total reclaimable size, last scan time, and primary actions
- Category cards for `Developer`, `Browsers`, `App Updates`, and `Docker`
- Each card shows total size, item count, and risk summary

Detail drawer:

- Opens from a category card
- Lists concrete cleanup targets inside that category
- Shows path, size, explanation, risk label, and selection checkbox

Operation log:

- Shows cleanup attempts, successes, skips, and failure reasons
- Makes it obvious when a target was in use, inaccessible, or already missing

## Technical Architecture

The implementation should keep cleanup logic separate from Electron-specific code so a future Tauri migration stays realistic.

### Layers

1. `Policy`
   Stores the cleanup registry. Each entry defines:
   - stable id
   - category
   - display names and descriptions in Chinese and English
   - one or more target paths or commands
   - risk level
   - scan method
   - cleanup method

2. `Scanner`
   Resolves each registry entry, checks path existence/access, and computes reclaimable size.

3. `Cleaner`
   Executes only user-selected entries. Default behavior is move-to-Trash, then report result.

4. `Electron bridge`
   - `main` process handles filesystem access, shell integration, and privileged actions
   - `preload` exposes a narrow typed API
   - `renderer` stays UI-only and never touches raw filesystem APIs directly

## Data Model

Suggested core shapes:

- `CleanupCategory`: `developer | browsers | app_updates | docker`
- `RiskLevel`: `safe | caution`
- `CleanupTargetDefinition`
- `ScanResult`
- `CleanupExecutionResult`
- `OperationLogEntry`

Important fields:

- registry id
- localized title and description
- resolved path or command target
- reclaimable bytes
- existence/access flags
- risk level
- cleanup status
- failure reason when relevant

## Data Flow

1. App starts and loads the cleanup registry.
2. User clicks `Scan`.
3. Renderer requests a scan through the preload bridge.
4. Scanner evaluates the white-listed targets and returns categorized results.
5. Dashboard updates totals and category cards.
6. User opens a detail drawer and selects cleanup targets.
7. User confirms cleanup.
8. Cleaner moves selected targets to Trash.
9. App refreshes the affected scan state and appends operation log entries.

## Safety Model

Safety is the main product constraint for v1.

Rules:

- Scan white-listed targets only
- Never allow free-form path deletion in v1
- Show risk labels and localized explanations for every item
- Require explicit manual selection before cleanup
- Prefer Trash over permanent deletion
- Skip inaccessible, missing, or currently-blocked targets and explain why

Practical implication:

- Some space is not fully reclaimed until the user empties Trash manually

## Packaging And Runtime

Recommended stack:

- Electron
- TypeScript
- `pnpm`
- an Electron-friendly frontend stack with a small local state layer
- `electron-builder` for packaged macOS app output

Run modes:

- Development: local Electron dev command
- Distribution: packaged macOS `.app`

## Testing Strategy

At minimum, verify these paths:

- Developer cache scan and cleanup flow
- Browser cache scan and cleanup flow
- App updater residue scan and cleanup flow
- Docker cleanup scan and cleanup flow

For each category, verify:

- scan result appears
- size is surfaced in UI
- manual selection works
- cleanup moves target to Trash or reports a clear skip/failure
- log entry is written

Testing levels:

- unit tests for registry/path resolution and risk classification
- unit tests for scan result normalization
- integration-style tests for cleanup execution orchestration using temp directories/mocks
- a manual verification checklist for the packaged app

## Implementation Shape

Recommended initial milestones:

1. Scaffold the Electron app under `/Users/bruceluo/Desktop/Developer`
2. Build registry, scanner, and localized data contracts
3. Build dashboard, category cards, and detail drawer
4. Add cleanup execution via Trash-first behavior
5. Add logging, bilingual copy, and packaging

## Key Decisions

- Use Electron for v1 because the local Node toolchain is ready and local Rust tooling is currently broken
- Keep scanning/cleanup logic independent from Electron UI glue to preserve a possible future Tauri migration
- Limit v1 to high-value, lower-risk cleanup categories
- Require manual selection and use Trash-first cleanup for safer recovery
