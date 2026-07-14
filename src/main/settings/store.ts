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

export interface SettingsStore {
  load: () => Promise<AppSettings>
  save: (value: AppSettings) => Promise<void>
}

export function createSettingsStore(
  path: string,
  fs: FileDeps,
  allowed: AllowedValues
): SettingsStore {
  const sanitize = (value: Partial<AppSettings>): AppSettings => {
    const enabledCategories = Array.isArray(value.enabledCategories)
      ? value.enabledCategories.filter((category) => allowed.categories.includes(category))
      : [...allowed.categories]
    const selectedTargetIds = Array.isArray(value.selectedTargetIds)
      ? value.selectedTargetIds.filter((id) => allowed.targetIds.includes(id))
      : []

    return {
      locale: value.locale === 'en' ? 'en' : 'zh',
      enabledCategories,
      selectedTargetIds
    }
  }

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
