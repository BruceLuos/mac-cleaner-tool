import { describe, expect, it } from 'vitest'

import { createSettingsStore, DEFAULT_SETTINGS } from './store'

const categories = ['developer', 'browsers', 'app_updates', 'docker'] as const

function memoryFs(initial: Record<string, string> = {}): {
  files: Map<string, string>
  deps: {
    readFile: (path: string) => Promise<string>
    writeFile: (path: string, value: string) => Promise<void>
    rename: (from: string, to: string) => Promise<void>
  }
} {
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
      categories: [...categories],
      targetIds: ['npm-cache']
    })

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips valid settings and filters unknown values', async () => {
    const fs = memoryFs()
    const store = createSettingsStore('/settings.json', fs.deps, {
      categories: [...categories],
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
      categories: [...categories],
      targetIds: []
    })

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS)
  })
})
