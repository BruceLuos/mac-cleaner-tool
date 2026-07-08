import type { ElectronAPI } from '@electron-toolkit/preload'

import type {
  CleanupExecutionResult,
  CleanupExecutionTarget,
  CleanupTargetDefinition,
  ScanResult
} from '../shared/cleanup-types'

export interface MacCleanerAPI {
  getRegistry: () => Promise<CleanupTargetDefinition[]>
  scan: () => Promise<ScanResult[]>
  cleanSelected: (targets: CleanupExecutionTarget[]) => Promise<CleanupExecutionResult[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    macCleaner: MacCleanerAPI
  }
}
