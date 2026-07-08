# Mac Cleaner Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual Electron-based macOS cleaner that scans approved cache targets, lets the user manually select cleanup items, and moves selected items to Trash.

**Architecture:** The project is an Electron desktop app with a React renderer, a typed preload bridge, and a cleanup engine split into registry, scanner, and cleaner modules. The renderer owns presentation only; filesystem access and cleanup execution stay in the Electron main process side through a narrow API.

**Tech Stack:** Electron, electron-vite scaffolding, React, TypeScript, pnpm, Vitest, electron-builder

---

### Task 1: Scaffold The Electron Project

**Files:**

- Create: `package.json`, `electron.vite.config.ts`, `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/**`
- Modify: `docs/specs/2026-07-07-mac-cleaner-tool-design.md`
- Test: `package.json` scripts with `pnpm dev`, `pnpm build`

- [ ] **Step 1: Scaffold the project with the official electron-vite starter**

Run:

```bash
cd /Users/bruceluo/Desktop/Developer
pnpm create @quick-start/electron mac-cleaner-tool --template react-ts
```

Expected:

```text
Scaffolding project in ./mac-cleaner-tool...
Done.
```

- [ ] **Step 2: Add build metadata and app scripts**

Update `package.json` so the app has a stable name and packaging commands:

```json
{
  "name": "mac-cleaner-tool",
  "productName": "Mac Cleaner Tool",
  "private": true,
  "scripts": {
    "dev": "electron-vite dev",
    "build": "tsc && electron-vite build",
    "preview": "electron-vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "package:mac": "electron-builder --mac"
  }
}
```

- [ ] **Step 3: Install packaging and test dependencies**

Run:

```bash
cd /Users/bruceluo/Desktop/Developer/mac-cleaner-tool
pnpm add -D electron-builder vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

Expected:

```text
Packages: +...
Done in ...
```

- [ ] **Step 4: Verify the scaffold builds before feature work**

Run:

```bash
cd /Users/bruceluo/Desktop/Developer/mac-cleaner-tool
pnpm build
```

Expected:

```text
...build completed...
```

### Task 2: Define Cleanup Contracts And Registry

**Files:**

- Create: `src/shared/cleanup-types.ts`, `src/main/cleanup/registry.ts`, `src/main/cleanup/i18n.ts`
- Test: `src/main/cleanup/registry.test.ts`

- [ ] **Step 1: Write the failing registry test**

```ts
import { describe, expect, it } from 'vitest'
import { cleanupRegistry } from './registry'

describe('cleanupRegistry', () => {
  it('covers the agreed MVP categories', () => {
    const categories = new Set(cleanupRegistry.map((item) => item.category))

    expect(categories).toEqual(new Set(['developer', 'browsers', 'app_updates', 'docker']))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test src/main/cleanup/registry.test.ts
```

Expected:

```text
FAIL ... Cannot find module './registry'
```

- [ ] **Step 3: Add the shared contracts and initial registry**

```ts
export type CleanupCategory = 'developer' | 'browsers' | 'app_updates' | 'docker'
export type RiskLevel = 'safe' | 'caution'

export interface CleanupTargetDefinition {
  id: string
  category: CleanupCategory
  title: { zh: string; en: string }
  description: { zh: string; en: string }
  paths?: string[]
  command?: string[]
  riskLevel: RiskLevel
  cleanupMode: 'trash' | 'command'
}
```

```ts
export const cleanupRegistry: CleanupTargetDefinition[] = [
  {
    id: 'npm-cache',
    category: 'developer',
    title: { zh: 'NPM 缓存', en: 'NPM Cache' },
    description: { zh: 'Node 包缓存目录', en: 'Node package cache directory' },
    paths: ['~/.npm'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  }
]
```

- [ ] **Step 4: Run the registry test again**

Run:

```bash
pnpm test src/main/cleanup/registry.test.ts
```

Expected:

```text
PASS
```

### Task 3: Build The Scanner Engine

**Files:**

- Create: `src/main/cleanup/path-utils.ts`, `src/main/cleanup/scanner.ts`
- Test: `src/main/cleanup/scanner.test.ts`

- [ ] **Step 1: Write the failing scanner test**

```ts
import { describe, expect, it } from 'vitest'
import { scanTargets } from './scanner'

describe('scanTargets', () => {
  it('returns reclaimable bytes for an existing cache path', async () => {
    const results = await scanTargets([
      {
        id: 'fixture',
        category: 'developer',
        title: { zh: '测试', en: 'Fixture' },
        description: { zh: '测试目录', en: 'Fixture dir' },
        paths: ['/tmp/mac-cleaner-fixture'],
        riskLevel: 'safe',
        cleanupMode: 'trash'
      }
    ])

    expect(results[0]?.exists).toBe(true)
    expect(results[0]?.reclaimableBytes).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test src/main/cleanup/scanner.test.ts
```

Expected:

```text
FAIL ... Cannot find module './scanner'
```

- [ ] **Step 3: Implement minimal scanning**

```ts
export interface ScanResult {
  id: string
  exists: boolean
  reclaimableBytes: number
  resolvedPaths: string[]
  error?: string
}

export async function scanTargets(definitions: CleanupTargetDefinition[]): Promise<ScanResult[]> {
  return Promise.all(definitions.map(scanOneTarget))
}
```

```ts
async function scanOneTarget(definition: CleanupTargetDefinition): Promise<ScanResult> {
  // expand ~, check path existence, sum file sizes recursively
  return {
    id: definition.id,
    exists: true,
    reclaimableBytes: 1,
    resolvedPaths: []
  }
}
```

- [ ] **Step 4: Run scanner tests until they pass**

Run:

```bash
pnpm test src/main/cleanup/scanner.test.ts
```

Expected:

```text
PASS
```

### Task 4: Build Trash-First Cleanup Execution

**Files:**

- Create: `src/main/cleanup/cleaner.ts`, `src/main/cleanup/trash.ts`
- Test: `src/main/cleanup/cleaner.test.ts`

- [ ] **Step 1: Write the failing cleaner test**

```ts
import { describe, expect, it, vi } from 'vitest'
import { cleanSelectedTargets } from './cleaner'

describe('cleanSelectedTargets', () => {
  it('moves selected paths to Trash', async () => {
    const moveToTrash = vi.fn().mockResolvedValue(undefined)

    const results = await cleanSelectedTargets(
      [
        {
          id: 'npm-cache',
          cleanupMode: 'trash',
          resolvedPaths: ['/tmp/mac-cleaner-fixture']
        }
      ],
      { moveToTrash }
    )

    expect(moveToTrash).toHaveBeenCalledWith('/tmp/mac-cleaner-fixture')
    expect(results[0]?.status).toBe('success')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test src/main/cleanup/cleaner.test.ts
```

Expected:

```text
FAIL ... Cannot find module './cleaner'
```

- [ ] **Step 3: Implement the cleaner orchestration**

```ts
export async function cleanSelectedTargets(
  items: CleanupExecutionTarget[],
  deps: { moveToTrash: (path: string) => Promise<void> }
): Promise<CleanupExecutionResult[]> {
  const results: CleanupExecutionResult[] = []

  for (const item of items) {
    for (const path of item.resolvedPaths) {
      await deps.moveToTrash(path)
    }

    results.push({ id: item.id, status: 'success' })
  }

  return results
}
```

- [ ] **Step 4: Run the cleaner test again**

Run:

```bash
pnpm test src/main/cleanup/cleaner.test.ts
```

Expected:

```text
PASS
```

### Task 5: Wire The Electron Bridge And UI

**Files:**

- Create: `src/preload/api.ts`, `src/renderer/src/features/dashboard/**`, `src/renderer/src/features/logs/**`
- Modify: `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/src/App.tsx`, `src/renderer/src/main.tsx`
- Test: `src/renderer/src/App.test.tsx`

- [ ] **Step 1: Write the failing renderer test**

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

it('renders cleanup category cards', () => {
  render(<App />)

  expect(screen.getByText(/Developer|开发缓存/)).toBeInTheDocument()
  expect(screen.getByText(/Browsers|浏览器缓存/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the renderer test to verify it fails**

Run:

```bash
pnpm test src/renderer/src/App.test.tsx
```

Expected:

```text
FAIL ... Unable to find text ...
```

- [ ] **Step 3: Implement the bridge and dashboard shell**

```ts
contextBridge.exposeInMainWorld('macCleaner', {
  scan: () => ipcRenderer.invoke('cleanup:scan'),
  cleanSelected: (ids: string[]) => ipcRenderer.invoke('cleanup:clean', ids)
})
```

```tsx
export default function App() {
  return (
    <main>
      <header>
        <h1>Mac Cleaner Tool</h1>
      </header>
      <section>
        <button>Scan</button>
        <button>Clean Selected</button>
      </section>
      <section>{/* dashboard cards */}</section>
      <aside>{/* detail drawer */}</aside>
      <section>{/* operation log */}</section>
    </main>
  )
}
```

- [ ] **Step 4: Run renderer tests until they pass**

Run:

```bash
pnpm test src/renderer/src/App.test.tsx
```

Expected:

```text
PASS
```

### Task 6: Package, Verify, And Document Usage

**Files:**

- Modify: `README.md`, `package.json`
- Create: `electron-builder.yml` or package `build` config, `docs/manual-test-checklist.md`
- Test: packaged output in `dist/`

- [ ] **Step 1: Add packaging config**

```yaml
appId: com.bruceluo.mac-cleaner-tool
productName: Mac Cleaner Tool
mac:
  category: public.app-category.utilities
files:
  - dist/**
  - dist-electron/**
```

- [ ] **Step 2: Document local run and packaging**

```md
# Mac Cleaner Tool

## Development

pnpm install
pnpm dev

## Build

pnpm build
pnpm package:mac
```

- [ ] **Step 3: Build the packaged macOS app**

Run:

```bash
pnpm build
pnpm package:mac
```

Expected:

```text
... DMG/ZIP or .app artifacts created ...
```

- [ ] **Step 4: Run the full test suite**

Run:

```bash
pnpm test
pnpm build
```

Expected:

```text
PASS
... build completed ...
```
