import type { CleanupCategory } from './cleanup-types'

export type Locale = 'zh' | 'en'

export interface AppSettings {
  locale: Locale
  enabledCategories: CleanupCategory[]
  selectedTargetIds: string[]
}
