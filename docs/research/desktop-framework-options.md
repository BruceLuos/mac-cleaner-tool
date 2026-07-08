# Desktop Framework Options

> **Provenance:** Original research from Trellis task `07-07-mac-cleaner-tool/research/`, moved
> into the project. The decision it informed is recorded in
> [ADR 0001 — Electron over Tauri](../decisions/0001-electron-over-tauri.md).

Date: 2026-07-07

## Question

What desktop-app approach is the best fit for the first version of a personal macOS cleaner tool
on this machine?

## Repo / Machine Constraints

- `node` is available: `v24.3.0`
- `pnpm` is available: `11.5.1`
- `cargo` is currently broken on this machine because
  `/opt/homebrew/opt/openssl@1.1/lib/libssl.1.1.dylib` is missing.
- The tool is intended for local personal use under `/Users/bruceluo/Desktop/Developer`.

## Official Source Notes

### Electron

Source: Electron prerequisites docs and overview

- Electron development requires Node.js and npm locally.
- Electron bundles Chromium and Node.js with the application runtime.
- Electron is a straightforward fit for teams already comfortable with JavaScript/HTML/CSS.

Sources:

- https://electronjs.org/docs/latest/tutorial/tutorial-prerequisites
- https://electronjs.org/docs/latest

### Tauri

Source: Tauri v2 prerequisites, start docs, and architecture docs

- Tauri requires Rust for development.
- Tauri supports web frontends plus a Rust-powered backend layer.
- Tauri is designed for smaller and faster binaries than Electron, but introduces a Rust
  toolchain dependency and more setup surface.

Sources:

- https://v2.tauri.app/start/prerequisites/
- https://v2.tauri.app/start/
- https://v2.tauri.app/concept/architecture/

## Practical Comparison For This Task

### Approach A: Electron desktop app with a local scanning/cleanup engine

How it works:

- Build the UI with HTML/CSS/JS or React.
- Use Electron main/preload processes to expose filesystem-safe cleanup operations to the renderer.

Pros:

- Works with the machine's current healthy toolchain.
- Fastest path to a usable desktop app.
- Rich UI possibilities for category scan results, warnings, and confirmation flows.
- Easy packaging later if needed.

Cons:

- App bundle and runtime footprint are larger than Tauri.
- Requires care around Electron security boundaries.

### Approach B: Tauri desktop app

How it works:

- Build a web UI and use Rust commands for cleanup operations.

Pros:

- Smaller binaries and leaner runtime.
- Good long-term fit if distribution and footprint matter.

Cons:

- Blocked today by the machine's broken Rust/cargo setup.
- Higher implementation/setup overhead for this first version.

### Approach C: Native shell wrapper around a local web app

How it works:

- Run a local service/UI and wrap it minimally.

Pros:

- Potentially flexible architecture.
- Can reuse web app patterns.

Cons:

- Adds lifecycle complexity for local server startup/shutdown.
- Worse fit than Electron for a simple single-user desktop utility.

## Recommendation

Recommend **Approach A: Electron desktop app** for v1.

Reasoning:

- It matches the machine's currently working toolchain.
- It minimizes setup risk and gets to a real usable app faster.
- The app's main value is safe scan/preview/delete workflows, where UI clarity matters more
  than binary size in the first version.

## Follow-up Implication

If the user later wants a smaller packaged app, a future migration to Tauri remains possible
after the local Rust toolchain is repaired. (Tracked as a v3 item in [../roadmap.md](../roadmap.md).)
