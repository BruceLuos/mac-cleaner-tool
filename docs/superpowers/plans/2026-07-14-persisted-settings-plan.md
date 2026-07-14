# Persisted Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist locale, enabled cleanup categories, and selected target IDs across launches using a validated JSON file in Electron's user-data directory.

**Architecture:** Add a dependency-injected, Electron-free settings store with atomic JSON writes. Expose typed `getSettings` and `saveSettings` methods through IPC; the renderer loads settings on startup and saves user changes while filtering restored values against the current registry. Disabled categories are presentation/selection filters and do not expand the cleanup API.

**Tech Stack:** TypeScript, Electron, React, Vitest, Testing Library, pnpm

---

### Task 1: Define settings contracts and build the settings store

**Files:**

- Create: `src/shared/settings-types.ts`
- Create: `src/main/settings/store.ts`
- Test: `src/main/settings/store.test.ts`

- [ ] **Step 1: Write the failing settings store tests**

```ts
import { describe, expect, it } from 'vitest'
import { createSettingsStore, DEFAULT_SETTINGS } from './store'

function memoryFs(initial: Record<string, string> = {}) {
  const files = new Map(Object.entries(initial))
  return {
    files,
    deps: {
      readFile: async (path: string) => {
        const value = files.get(path)
        if (value === undefined) throw new Error('ENOENT')
        return value
      },
      writeFile: async (path: string, value: string) => {
        files.set(path, value)
      },
      rename: async (from: string, to: string) => {
        const value = files.get(from)
        if (value === undefined) throw new Error('missing temp file')
        files.set(to, value)
        files.delete(from)
      }
    }
  }
}

describe('settings store', () => {
  it('returns defaults when settings are missing', async () => {
    const fs = memoryFs()
    const store = createSettingsStore('/settings.json', fs.deps, {
      categories: ['developer', 'browsers'],
      targetIds: ['npm-cache']
    })

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips valid settings and filters unknown values', async () => {
    const fs = memoryFs()
    const store = createSettingsStore('/settings.json', fs.deps, {
      categories: ['developer', 'browsers'],
      targetIds: ['npm-cache']
    })
    const settings = {
      locale: 'en' as const,
      enabledCategories: ['browsers', 'unknown'] as never[],
      selectedTargetIds: ['npm-cache', 'missing']
    }

    await store.save(settings)

    await expect(store.load()).resolves.toEqual({
      locale: 'en',
      enabledCategories: ['browsers'],
      selectedTargetIds: ['npm-cache']
    })
  })

  it('falls back to defaults when JSON is malformed', async () => {
    const fs = memoryFs({ '/settings.json': '{broken' })
    const store = createSettingsStore('/settings.json', fs.deps, {
      categories: ['developer'],
      targetIds: []
    })

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS)
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails because the store is missing**

Run: `rtk pnpm test src/main/settings/store.test.ts`

Expected: Vitest fails with a module-not-found error for `./store`.

- [ ] **Step 3: Add the shared settings type**

```ts
import type { CleanupCategory } from './cleanup-types'

export type Locale = 'zh' | 'en'

export interface AppSettings {
  locale: Locale
  enabledCategories: CleanupCategory[]
  selectedTargetIds: string[]
}
```

- [ ] **Step 4: Implement the minimal validated store with atomic writes**

```ts
import type { CleanupCategory } from '../../shared/cleanup-types'
import type { AppSettings } from '../../shared/settings-types'

export const DEFAULT_SETTINGS: AppSettings = {
  locale: 'zh',
  enabledCategories: ['developer', 'browsers', 'app_updates', 'docker'],
  selectedTargetIds: []
}

interface FileDeps {
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, value: string) => Promise<void>
  rename: (from: string, to: string) => Promise<void>
}

interface AllowedValues {
  categories: CleanupCategory[]
  targetIds: string[]
}

export function createSettingsStore(path: string, fs: FileDeps, allowed: AllowedValues) {
  const sanitize = (value: Partial<AppSettings>): AppSettings => ({
    locale: value.locale === 'en' ? 'en' : 'zh',
    enabledCategories: (value.enabledCategories ?? DEFAULT_SETTINGS.enabledCategories).filter((category) =>
      allowed.categories.includes(category)
    ),
    selectedTargetIds: (value.selectedTargetIds ?? []).filter((id) => allowed.targetIds.includes(id))
  })

  return {
    async load(): Promise<AppSettings> {
      try {
        return sanitize(JSON.parse(await fs.readFile(path)) as Partial<AppSettings>)
      } catch {
        return { ...DEFAULT_SETTINGS, enabledCategories: [...allowed.categories] }
      }
    },
    async save(value: AppSettings): Promise<void> {
      const safe = sanitize(value)
      const tempPath = `${path}.tmp`
      await fs.writeFile(tempPath, JSON.stringify(safe, null, 2))
      await fs.rename(tempPath, path)
    }
  }
}
```

Use Node's `fs.promises.readFile`, `writeFile`, and `rename` for the production dependency and ensure the parent `userData` directory exists before saving.

- [ ] **Step 5: Run the focused store tests and verify they pass**

Run: `rtk pnpm test src/main/settings/store.test.ts`

Expected: 3 tests pass.

### Task 2: Wire settings through main IPC and preload

**Files:**

- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/index.d.ts`
- Test: `src/main/settings/store.test.ts` remains the unit boundary; no Electron runtime test is required.

- [ ] **Step 1: Create the production store after Electron is ready**

Build allowed category and target lists from the existing cleanup registry, create the store at `join(app.getPath('userData'), 'settings.json')`, and register:

```ts
ipcMain.handle('settings:get', () => settingsStore.load())
ipcMain.handle('settings:save', (_event, settings: AppSettings) => settingsStore.save(settings))
```

The save handler must pass the payload through the same allowed category and target ID lists before writing.

- [ ] **Step 2: Extend the preload bridge and declaration**

```ts
getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
saveSettings: (settings: AppSettings): Promise<void> => ipcRenderer.invoke('settings:save', settings)
```

Add matching methods to `MacCleanerAPI` and import `AppSettings` from the shared settings types.

- [ ] **Step 3: Run type checking to verify the IPC contract compiles**

Run: `rtk pnpm typecheck`

Expected: no TypeScript errors.

### Task 3: Restore and save locale and selection state in the renderer

**Files:**

- Modify: `src/renderer/src/i18n/I18nProvider.tsx`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/i18n/messages.ts`
- Test: `src/renderer/src/App.test.tsx`

- [ ] **Step 1: Add a failing renderer test for persisted settings**

Mock `window.macCleaner` with `getRegistry`, `getSettings`, `saveSettings`, `scan`, and `cleanSelected`; render `App` and assert that an English saved locale renders English category labels and that saving is called after a category or target selection change.

```tsx
it('restores the saved locale and persists category changes', async () => {
  const saveSettings = vi.fn().mockResolvedValue(undefined)
  window.macCleaner = {
    getRegistry: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue({
      locale: 'en',
      enabledCategories: ['developer', 'browsers', 'app_updates', 'docker'],
      selectedTargetIds: []
    }),
    saveSettings,
    scan: vi.fn().mockResolvedValue([]),
    cleanSelected: vi.fn().mockResolvedValue([])
  }

  render(<App />)

  expect(await screen.findByText('Developer')).toBeInTheDocument()
  expect(saveSettings).not.toHaveBeenCalledWith(expect.objectContaining({ locale: 'zh' }))
})
```

- [ ] **Step 2: Run the renderer test and verify it fails because the bridge does not expose settings yet**

Run: `rtk pnpm test src/renderer/src/App.test.tsx`

Expected: the new test fails before the implementation can restore the saved locale.

- [ ] **Step 3: Allow `I18nProvider` to initialize from a persisted locale**

Add an optional `initialLocale` prop and initialize its locale state from that value while retaining the current default of Chinese.

- [ ] **Step 4: Load settings in `AppInner` and sanitize against the registry**

On mount, load registry and settings together. Restore only target IDs in the registry. Keep a `settingsReady` guard so the initial default state is not written back before the persisted settings finish loading.

- [ ] **Step 5: Save changes without blocking cleanup**

Call `saveSettings` after locale changes, category toggles, selection toggles, scan pruning, and successful cleanup. Catch save failures so they do not affect scan or clean operations.

- [ ] **Step 6: Add i18n labels for category enablement**

Add message keys for enabling and disabling a category in Chinese and English, used by the new card control's accessible label.

- [ ] **Step 7: Run renderer tests and verify they pass**

Run: `rtk pnpm test src/renderer/src/App.test.tsx`

Expected: all renderer tests pass.

### Task 4: Add category enable/disable presentation behavior

**Files:**

- Modify: `src/renderer/src/features/dashboard/Dashboard.tsx`
- Modify: `src/renderer/src/features/dashboard/CategoryCard.tsx`
- Modify: `src/renderer/src/features/selectors.ts`
- Modify: `src/renderer/src/App.tsx`
- Test: `src/renderer/src/App.test.tsx`

- [ ] **Step 1: Add a failing test for disabled categories**

Render with only `developer` enabled and assert that the disabled category is not shown in the dashboard and cannot contribute to the displayed total.

- [ ] **Step 2: Filter dashboard aggregates and totals by enabled categories**

Pass `enabledCategories` into `Dashboard`, map only enabled categories, and calculate the grand total from scan results whose registry entry belongs to an enabled category.

- [ ] **Step 3: Add the category toggle control**

Add an accessible button to `CategoryCard` that calls `onToggleEnabled` and does not trigger `onOpen`. Disabled cards should not render or should visibly indicate their disabled state according to the existing layout; preserve the four-category default view.

- [ ] **Step 4: Prevent selection and drawer access for disabled categories**

When disabling a category, remove its target IDs from `selectedIds` and close its drawer if open. The clean payload builder must continue accepting only registry-backed, existing scan results.

- [ ] **Step 5: Run renderer tests and verify disabled-category behavior passes**

Run: `rtk pnpm test src/renderer/src/App.test.tsx`

Expected: all renderer tests pass.

### Task 5: Complete documentation and verification

**Files:**

- Modify: `README.md`
- Modify: `docs/manual-test-checklist.md`

- [ ] **Step 1: Document settings persistence and recovery behavior**

Explain that settings are local to the app's user-data directory, defaults are used when the file is missing/corrupt, and settings never contain cleanup paths.

- [ ] **Step 2: Add manual checks for persistence**

```md
- [ ] Restarting the app preserves locale, enabled categories, and selected targets
- [ ] Disabling a category removes it from totals and detail access
- [ ] A missing or malformed settings file falls back to Chinese, all categories enabled, and no selection
```

- [ ] **Step 3: Run the complete verification suite**

Run: `rtk pnpm test`, `rtk pnpm typecheck`, `rtk pnpm lint`, and `rtk pnpm build`.

Expected: all tests pass, no type/lint errors, and production bundles build successfully.

- [ ] **Step 4: Inspect the final diff**

Run: `rtk git diff --check` and `rtk git status --short`.

Expected: no whitespace errors and only the planned settings, IPC, renderer, and documentation files are changed.
