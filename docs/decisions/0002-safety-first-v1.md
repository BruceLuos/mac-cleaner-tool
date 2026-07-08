# ADR 0002 — v1 is safety-first: white-list, manual select, Trash-only

- **Status:** Accepted (v1)
- **Date:** 2026-07-07
- **Supersedes:** none

## Context

A personal cleanup tool can easily do more harm than the space it reclaims. v1 needed a product
stance on how aggressive to be by default.

## Decision

v1 is deliberately **safety-first**:

1. **White-listed targets only.** The registry (`src/main/cleanup/registry.ts`) is the sole
   source of scannable/cleanable paths. There is no free-form-path API.
2. **Manual selection required.** Nothing is cleaned without an explicit per-item tick and a
   confirmation prompt. No "clean everything" button in v1.
3. **Trash, never permanent delete.** `shell.trashItem` is the only removal path. Space is
   reclaimed fully only after the user empties Trash — an acceptable trade for recoverability.
4. **Risk labels everywhere.** Every target carries `safe` / `caution` plus a bilingual
   explanation; skips/failures are always logged with a reason.

## Consequences

- Recovery is always possible until Trash is emptied.
- Some targets (e.g. Docker build cache) free space only indirectly and report size at clean
  time rather than up front.
- v1 deliberately leaves high-value-but-riskier features (large-file hunting, downloads
  cleanup, one-click auto-clean, permanent delete) out of scope — see [roadmap.md](../roadmap.md).

## Why not a stricter stance

Permanent deletion and auto-clean are useful power features; we are deferring them, not
forbidding them. Each returns in a later phase behind an explicit opt-in and a review step.
