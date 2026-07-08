# Documentation

This folder is the **single source of truth** for the Mac Cleaner Tool. The design spec that
originally lived in the `camel_g3` repo has been consolidated here.

## Reading order

| Order | Document | What it answers |
| ----- | -------- | --------------- |
| 1 | [prd.md](prd.md) | **What was asked** — original product requirements, assumptions, acceptance criteria (all met by v1) |
| 2 | [specs/2026-07-07-mac-cleaner-tool-design.md](specs/2026-07-07-mac-cleaner-tool-design.md) | **What & why** — v1 product scope, safety model, data model, testing strategy |
| 3 | [architecture.md](architecture.md) | **How it's actually built** — as-built layers, data flow, divergences from the plan |
| 4 | [decisions/](decisions/) | **Why these choices** — ADRs (Electron over Tauri, Trash-first, dep injection, …) |
| 5 | [research/desktop-framework-options.md](research/desktop-framework-options.md) | **Supporting research** — framework comparison behind ADR 0001 |
| 6 | [plans/2026-07-07-mac-cleaner-tool-implementation-plan.md](plans/2026-07-07-mac-cleaner-tool-implementation-plan.md) | **How it was built** — the task-by-task TDD plan that produced v1 |
| 7 | [manual-test-checklist.md](manual-test-checklist.md) | **How to verify a release** — human test matrix per category |
| 8 | [roadmap.md](roadmap.md) | **What's next** — prioritized v1.1 / v2 / v3 requirements |

## Conventions

- `prd.md` — frozen original requirements for v1. Historical record; do not grow it.
- `specs/` — frozen design intent for a shipped version. Date-prefixed. Edit only to correct
  errors; new scope goes in `roadmap.md` and spawns a new dated spec when implemented.
- `plans/` — the concrete build plan that realized a spec. Historical record.
- `architecture.md` — living document. Update whenever the code structure changes materially.
- `decisions/` — append-only ADRs (`NNNN-slug.md`). Never edit a merged ADR; supersede it.
- `research/` — supporting research that informed a decision. Historical record.
- `roadmap.md` — living prioritized backlog. Re-rank freely.

## Status (2026-07-07)

v1 shipped and green: typecheck, lint, 10 unit/component tests, production build, and an
unsigned `arm64` `.app`/`.dmg` all pass. See the [manual test checklist](manual-test-checklist.md)
for the human verification still owed (GUI scan/clean flows inside the running app).
