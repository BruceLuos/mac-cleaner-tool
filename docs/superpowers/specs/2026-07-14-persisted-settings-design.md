# Persisted Settings Design

## Goal

Persist the user's locale, category enablement choices, and last selected cleanup targets across app launches without weakening the existing whitelist, manual-selection, or Trash-first safety model.

## Scope

Persist these settings in `settings.json` under Electron's `app.getPath('userData')` directory:

- `locale`: `'zh' | 'en'`
- `enabledCategories`: all enabled `CleanupCategory` values
- `selectedTargetIds`: target IDs selected in the renderer

No cleanup path, command, registry definition, scan result, or operation log is persisted.

## Architecture

Add an Electron-free settings store in `src/main/settings/` that receives its file path and filesystem operations through dependency injection. The production main process creates the store after Electron is ready, using `app.getPath('userData')`. The store reads and validates JSON, falls back to defaults when the file is missing or invalid, and writes through a temporary file followed by rename.

Extend the typed preload bridge with `getSettings()` and `saveSettings(settings)`. The main process validates settings again at the IPC boundary and persists only recognized locale, category, and target IDs. Renderer state initializes from settings and saves changes to locale, category toggles, and target selection.

## UI behavior

Each category card gets an enable/disable control. Disabled categories remain out of the reclaimable total and cannot open their detail drawer. The existing scan continues to use the registry whitelist; disabled categories are filtered from presentation and selection rather than creating a new filesystem API.

On startup, selected target IDs are restored only when they are present in the current registry. After a scan, missing or non-existent targets are removed from the active selection. Successful cleanup clears cleaned IDs and saves the updated selection. Existing confirmation, logging, and Trash behavior are unchanged.

## Failure handling

- Missing settings file: use defaults and create it on the first successful save.
- Malformed JSON, invalid locale, unknown categories, or unknown target IDs: discard invalid values and retain valid values where possible; if parsing fails, use all defaults.
- Failed settings writes: keep the current in-memory state and log no cleanup error; settings persistence must never block scanning or cleaning.
- Failed settings reads: start normally with defaults.

Defaults are Chinese locale, all registry categories enabled, and no selected targets.

## Testing

Unit tests cover default loading, valid round-trip persistence, invalid JSON fallback, removal of unknown category/target IDs, and atomic save behavior through injected filesystem dependencies. Renderer tests cover restoring locale and selections, toggling category enablement, excluding disabled categories from totals/open actions, and saving state changes.

Existing cleanup engine, IPC, build, and safety tests must remain green.

## Non-goals

- Persisting scan results or operation logs.
- Syncing settings across machines.
- Adding arbitrary custom cleanup targets.
- Changing scan or cleanup safety boundaries.
