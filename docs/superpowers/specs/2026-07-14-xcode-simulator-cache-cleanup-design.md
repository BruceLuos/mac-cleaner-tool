# Xcode and iOS Simulator Cache Cleanup Design

## Goal

Expand the v1.1 registry with safe, high-value Xcode and iOS Simulator cache targets while preserving the existing whitelist, explicit selection, and Trash-first safety model.

## Scope

The feature covers only regenerable cache data:

- Xcode DerivedData: `~/Library/Developer/Xcode/DerivedData`
- CoreSimulator caches: `~/Library/Developer/CoreSimulator/Caches`

It must not scan or clean simulator device data, simulator runtimes, user projects, build products outside DerivedData, or arbitrary paths supplied by the renderer.

## Design

Add two path-mode registry entries, both marked `safe` and using `cleanupMode: 'trash'`:

- `xcode-derived-data`: Xcode DerivedData
- `coresimulator-caches`: CoreSimulator caches

The existing scanner resolves the whitelisted `~` paths and measures them recursively. The existing cleaner moves selected resolved paths to Trash. No new scanner, cleaner, IPC, or renderer protocol is required because the feature uses the existing target-definition contract.

Each entry receives Chinese and English title and description text explaining that the contents are regenerable caches and that removing them may cause Xcode or Simulator to rebuild data later. Missing paths remain visible as unavailable, following current behavior.

## Data flow

1. The main process returns the expanded registry through the existing `cleanup:registry` IPC channel.
2. The renderer displays the new targets under the Developer category.
3. A scan reports existence, resolved path, and reclaimable bytes using the existing scanner.
4. The user manually selects a target and confirms cleanup.
5. The existing cleaner moves the selected cache directory to Trash and records the result in the existing operation log.

## Testing

Add registry assertions that the new entries exist with the exact paths, `safe` risk, and Trash cleanup mode. Run the existing registry, scanner, cleaner, and renderer test suites to ensure the expanded registry does not change the safety contract or category rendering.

Manual verification must confirm that the new Developer targets appear, show their measured size when present, require explicit selection, move only the selected cache directory to Trash, and leave simulator device data and runtimes untouched.

## Non-goals

- Cleaning simulator device data or runtimes.
- Cleaning arbitrary Xcode folders.
- Adding permanent deletion or command-mode cleanup.
- Adding progress streaming or settings persistence in this change.
