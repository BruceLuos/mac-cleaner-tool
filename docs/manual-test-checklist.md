# Manual Test Checklist — Mac Cleaner Tool

Run these against `pnpm dev` (or the packaged `.app` from `pnpm build:mac`). Each row maps to
an acceptance criterion in the design spec. Tick boxes manually per release.

## Environment

- [ ] macOS, `pnpm install` succeeded
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm test` green (10 tests)
- [ ] `pnpm build` produces `out/main`, `out/preload`, `out/renderer`

## Per-category scan + clean

For each of **Developer**, **Browsers**, **App Updates**, **Docker**:

- [ ] Category card appears on the dashboard with a localized title
- [ ] After **Scan**, the card shows a non-zero size (when the target exists on this machine) and an item count
- [ ] Opening the card lists concrete targets with path, size, risk label, and a checkbox
- [ ] Risk labels render correctly: `safe` (green) and `caution` (amber)
- [ ] Selecting a target and clicking **Clean Selected** moves it to Trash (verify in Finder → Trash)
- [ ] A success / skip / fail entry appears in the operation log with a reason when relevant
- [ ] After cleaning, re-scan reflects the reduced (or zero) size

## Safety behavior

- [ ] No target is cleaned without an explicit checkbox selection
- [ ] Clicking **Clean Selected** with nothing ticked shows the "select at least one" message
- [ ] Cleanup requires the confirmation dialog ("Move to Trash? Recoverable until you empty Trash.")
- [ ] A missing path scans as `exists=false` / "Not found" and cannot be selected
- [ ] A `caution`-labelled item still requires manual selection (no auto-clean)
- [ ] Command-mode targets (e.g. Docker) report "Shown after clean" for size and run the registered command on clean

## Bilingual UI

- [ ] Default render is Chinese; **中文 / EN** chips toggle every label, log message, and timestamp locale
- [ ] Operation log entries written in one locale still render correctly after switching

## Packaging

- [ ] `pnpm build:mac` completes and emits `dist/Mac Cleaner Tool.app` (+ `.dmg`)
- [ ] The `.app` launches (right-click → Open on first launch for the unsigned build)
- [ ] Scan + clean + log flows work identically inside the packaged app
