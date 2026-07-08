# Roadmap

Living, prioritized backlog. Re-rank freely. Each item carries **Value**, **Effort**, and
**Risk** so the next session can pick confidently. Every phase keeps the v1 safety stance
([ADR 0002](decisions/0002-safety-first-v1.md)): white-listed targets, manual selection,
Trash-first unless explicitly noted.

Legend — Value/Effort/Risk: `S` small · `M` medium · `L` large.

---

## v1.1 — Safe high-value breadth + UX polish

Goal: reclaim dramatically more space **without** raising the risk bar, and remove the small
paper-cuts noticed while building v1.

| # | Item | Value | Effort | Risk | Notes |
| - | ---- | ----- | ------ | ---- | ----- |
| 1 | **Xcode DerivedData / iOS Simulator / CoreSimulator caches** | L | S | S | Biggest single win on a dev Mac; all regenerate. Path-mode, `safe`. Likely GBs. |
| 2 | **Docker breadth**: dangling images, stopped containers, unused volumes, `system prune` | M | S | S | Extend docker beyond `builder prune`. Command-mode, `safe`. |
| 3 | **pnpm store / Yarn / Cargo / Gradle / Maven / Go / asdf caches** | M | M | S | Developer breadth. pnpm store path is dynamic — resolve via `pnpm store path` (small engine addition). |
| 4 | **More browsers**: Brave, Arc, Firefox | M | S | S | Path-mode, `safe`. Safari is protected; skip. |
| 5 | **Persisted settings** (locale, per-category enable, last selection) | M | S | S | Store in `app.getPath('userData')`; currently resets each launch. |
| 6 | **Scan progress / streaming** | M | M | S | Large dirs (Chrome cache, DerivedData) freeze the UI today; stream partial sizes or show a spinner + counts via IPC events. |
| 7 | **Accessibility**: keyboard nav, drawer focus trap, aria labels | M | M | S | Needed before any broader release. |
| 8 | **More locales** (e.g. ja/ko) | S | S | S | i18n structure already supports it; just add strings. |

**Recommended start:** #1 (DerivedData/Simulator) + #5 (persisted settings) + #6 (scan progress).
#1 alone is likely the largest reclaim the user will ever see from this tool.

---

## v2 — Power features behind explicit opt-in

Goal: the things v1 deliberately deferred. Each ships **off by default**, behind a setting and
a review/confirm step.

| # | Item | Value | Effort | Risk | Notes |
| - | ---- | ----- | ------ | ---- | ----- |
| 1 | **"Clean all safe" review mode** | M | M | M | One screen to review every `safe` target across categories before a single confirm. Never the default action. (Explicit v1 out-of-scope.) |
| 2 | **Large-file hunting in bounded roots** (e.g. `~/Library/Developer`, a projects dir) | L | L | M | Top-N biggest files/dirs, manual select, Trash. Bounded to chosen roots — **not** arbitrary disk scan. |
| 3 | **Trash integration**: show Trash size + optional "empty Trash" | M | M | M | Real reclaim needs this; strong confirm required. |
| 4 | **Permanent-delete opt-in per item** | S | M | L | For known-regenerating caches where Trash is overkill. Gated by setting + extra confirm. |
| 5 | **Downloads review** | M | M | M | List old downloads, manual select to Trash. (Explicit v1 out-of-scope.) |
| 6 | **Session undo / "put back"** | M | L | M | Track items trashed this session; offer restore via `NSWorkspace`. |
| 7 | **Scheduling / auto-scan reminder** | S | M | S | Optional reminder or auto-scan on launch / weekly. |

---

## v3 — Platform & architecture

| # | Item | Value | Effort | Risk | Notes |
| - | ---- | ----- | ------ | ---- | ----- |
| 1 | **Tauri migration** | M | L | M | Reuse the Electron-free engine; revisit after the Rust toolchain is repaired ([ADR 0001](decisions/0001-electron-over-tauri.md)). |
| 2 | **Cross-platform**: Windows + Linux | M | L | M | Platform-specific registry sections; paths differ widely. |
| 3 | **Plugin / custom targets** (settings-defined white-list) | M | M | M | Controlled escape hatch for advanced users — still Trash-only, still confirmed. Replaces "arbitrary deletion" with a sane mechanism. |
| 4 | **Privacy / telemetry-free guarantee doc** | S | S | S | Explicit statement; the app never phones home. |

---

## Non-goals (carried forward from v1)

- Blind deletion of arbitrary system files.
- Kernel / system "optimization" or memory-boosting voodoo.
- Behaviors that resemble malware (mass deletion, persistence tricks, evasion).

---

## From roadmap to work

When a phase is greenlit, promote its chosen items into a **new dated spec** under
`docs/specs/` (e.g. `YYYY-MM-DD-v1.1-spec.md`) and a matching `docs/plans/` build plan, then
implement task-by-task. Do not edit this roadmap as if it were a spec — it is the backlog.
