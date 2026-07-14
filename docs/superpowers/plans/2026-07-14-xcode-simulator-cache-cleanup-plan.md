# Xcode and iOS Simulator Cache Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe, explicitly selectable Xcode DerivedData and CoreSimulator cache targets to the existing macOS cleanup registry.

**Architecture:** Reuse the existing registry, scanner, cleaner, IPC, and renderer flows. The feature adds only two path-mode registry definitions and tests; no new filesystem or Electron boundary is introduced. Both targets resolve fixed `~` paths, are marked `safe`, and move to Trash through the existing cleaner.

**Tech Stack:** TypeScript, Electron, React, Vitest, pnpm

---

### Task 1: Specify the new registry targets with a failing test

**Files:**

- Modify: `src/main/cleanup/registry.test.ts`

- [ ] **Step 1: Add an assertion for the exact Xcode and CoreSimulator targets**

```ts
  it('includes only regenerable Xcode and CoreSimulator cache paths', () => {
    const targets = cleanupRegistry.filter((target) =>
      ['xcode-derived-data', 'coresimulator-caches'].includes(target.id)
    )

    expect(targets).toHaveLength(2)
    expect(targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'xcode-derived-data',
          category: 'developer',
          paths: ['~/Library/Developer/Xcode/DerivedData'],
          riskLevel: 'safe',
          cleanupMode: 'trash'
        }),
        expect.objectContaining({
          id: 'coresimulator-caches',
          category: 'developer',
          paths: ['~/Library/Developer/CoreSimulator/Caches'],
          riskLevel: 'safe',
          cleanupMode: 'trash'
        })
      ])
    )
  })
```

- [ ] **Step 2: Run the focused test and verify it fails for the missing entries**

Run: `rtk pnpm test src/main/cleanup/registry.test.ts`

Expected: the existing category test passes, while the new test fails because the registry contains zero matching targets.

### Task 2: Add the minimal whitelist entries

**Files:**

- Modify: `src/main/cleanup/registry.ts`

- [ ] **Step 1: Add the Xcode DerivedData definition in the developer cache section**

```ts
  {
    id: 'xcode-derived-data',
    category: 'developer',
    title: { zh: 'Xcode DerivedData', en: 'Xcode DerivedData' },
    description: {
      zh: 'Xcode 的可再生构建缓存，删除后下次构建会重新生成。',
      en: 'Regenerable Xcode build data; recreated by the next build.'
    },
    paths: ['~/Library/Developer/Xcode/DerivedData'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },
```

- [ ] **Step 2: Add the CoreSimulator cache definition beside it**

```ts
  {
    id: 'coresimulator-caches',
    category: 'developer',
    title: { zh: 'iOS 模拟器缓存', en: 'iOS Simulator Caches' },
    description: {
      zh: 'CoreSimulator 的可再生缓存，不包含模拟器设备数据或运行时。',
      en: 'Regenerable CoreSimulator caches; excludes device data and runtimes.'
    },
    paths: ['~/Library/Developer/CoreSimulator/Caches'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },
```

- [ ] **Step 3: Run the focused registry test and verify it passes**

Run: `rtk pnpm test src/main/cleanup/registry.test.ts`

Expected: 2 tests pass.

### Task 3: Update the release checklist

**Files:**

- Modify: `docs/manual-test-checklist.md`

- [ ] **Step 1: Add Xcode and Simulator checks under per-category scan and clean**

Add a Developer-specific note:

```md
For Xcode / iOS Simulator cache targets:

- [ ] Xcode DerivedData and iOS Simulator Caches appear as safe Developer targets when present
- [ ] Cleaning them moves only the selected cache directory to Trash; simulator devices and runtimes remain untouched
```

### Task 4: Run the complete verification suite

**Files:**

- No additional files

- [ ] **Step 1: Run all unit and component tests**

Run: `rtk pnpm test`

Expected: 4 test files and all tests pass.

- [ ] **Step 2: Run type checking and linting**

Run: `rtk pnpm typecheck` and `rtk pnpm lint`

Expected: no TypeScript errors and no ESLint errors.

- [ ] **Step 3: Run the production build**

Run: `rtk pnpm build`

Expected: Electron main, preload, and renderer bundles are generated successfully.

- [ ] **Step 4: Inspect the final diff and working tree**

Run: `rtk git diff --check` and `rtk git status --short`

Expected: no whitespace errors; only the intended registry, test, and checklist changes are present.
