export type CleanupCategory = 'developer' | 'browsers' | 'app_updates' | 'docker'

export type RiskLevel = 'safe' | 'caution'

export type CleanupMode = 'trash' | 'command'

export interface LocalizedText {
  zh: string
  en: string
}

export interface CleanupTargetDefinition {
  id: string
  category: CleanupCategory
  title: LocalizedText
  description: LocalizedText
  paths?: string[]
  /** Shell command used when cleanupMode === 'command'. argv[0] is the binary probed at scan time. */
  command?: string[]
  riskLevel: RiskLevel
  cleanupMode: CleanupMode
}

/** Outcome of scanning one registry entry. */
export interface ScanResult {
  id: string
  /** True when at least one resolved path exists, or the command binary is on PATH. */
  exists: boolean
  reclaimableBytes: number
  /** Expanded, existing filesystem paths the cleaner should act on (path-mode only). */
  resolvedPaths: string[]
  /** Reason the target could not be measured, when relevant (e.g. command-mode, access error). */
  note?: string
  error?: string
}

/** Compact selection payload passed from renderer to cleaner. */
export interface CleanupExecutionTarget {
  id: string
  cleanupMode: CleanupMode
  resolvedPaths: string[]
  command?: string[]
}

export type CleanupStatus = 'success' | 'skipped' | 'failed'

export interface CleanupExecutionResult {
  id: string
  status: CleanupStatus
  /** Bytes the scan attributed to this target, echoed back for the log. */
  reclaimableBytes: number
  reason?: string
}

export type OperationLogLevel = 'info' | 'success' | 'warning' | 'error'

export interface OperationLogEntry {
  id: string
  level: OperationLogLevel
  message: LocalizedText
  timestamp: number
}
