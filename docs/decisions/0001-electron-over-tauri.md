# ADR 0001 — Build v1 on Electron, not Tauri

- **Status:** Accepted (v1)
- **Date:** 2026-07-07
- **Supersedes:** none
- **Superseded by:** _(none yet — see roadmap v3 for the Tauri revisit)_

## Context

The tool must be a macOS desktop app. The realistic choices were Electron, Tauri, or a thin
shell around a local web UI. The decision needed to be made before scaffolding.

Relevant machine constraints observed on 2026-07-07:

- `node` v24.3.0 — working
- `pnpm` 11.5.1 — working
- `cargo` / Rust toolchain — **broken**: `/opt/homebrew/opt/openssl@1.1/lib/libssl.1.1.dylib`
  missing, which blocks any practical Tauri build today.

## Decision

Build v1 as an **Electron** desktop app.

## Consequences

- **Pro:** Ships now on the working Node/pnpm toolchain; rich UI for scan results, risk labels,
  and confirmation flows; trivial local packaging.
- **Pro:** The app's value in v1 is safe scan/preview/clean clarity, where UI quality matters
  more than binary size.
- **Con:** Larger runtime/bundle footprint than Tauri.
- **Con:** Requires discipline around Electron security boundaries (context isolation, narrow
  preload surface — both enforced in the as-built architecture).
- **Mitigation:** Cleanup/scanning logic is kept Electron-free (dependency-injected
  capabilities, see `src/main/cleanup/cleaner.ts` + `trash.ts`) so a future Tauri migration can
  reuse the engine wholesale.

## Alternatives considered

- **Tauri:** Smaller binaries, better long-term footprint — but blocked today by the broken
  Rust toolchain and higher setup overhead. Revisit in v3 after the toolchain is repaired.
- **Local web app + native shell:** Adds server lifecycle complexity for no benefit in a
  single-user desktop utility. Worse fit than Electron.

## Origin

Distilled from the framework-options research originally captured under the Trellis task
`07-07-mac-cleaner-tool`. The full comparison lives in this project's history; this ADR is the
durable, in-project record.
