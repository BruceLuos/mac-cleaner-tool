import type { ElectronAPI } from '@electron-toolkit/preload'

import type {
  CleanupExecutionResult,
  CleanupExecutionTarget,
  CleanupTargetDefinition,
  ScanResult
} from '../shared/cleanup-types'
import type { AppSettings } from '../shared/settings-types'

export interface MacCleanerAPI {
  getRegistry: () => Promise<CleanupTargetDefinition[]>
  scan: () => Promise<ScanResult[]>
  cleanSelected: (targets: CleanupExecutionTarget[]) => Promise<CleanupExecutionResult[]>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    macCleaner: MacCleanerAPI
  }
}
