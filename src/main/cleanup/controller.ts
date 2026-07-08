import type {
  CleanupExecutionResult,
  CleanupExecutionTarget,
  CleanupTargetDefinition,
  ScanResult
} from '../../shared/cleanup-types'
import { cleanSelectedTargets } from './cleaner'
import { cleanupRegistry } from './registry'
import { scanTargets } from './scanner'
import { macCleanerDeps } from './trash'

/** Thin orchestration layer the IPC handlers call into. Keeps main/index.ts glue-free. */
export function getRegistry(): CleanupTargetDefinition[] {
  return cleanupRegistry
}

export async function scanAll(): Promise<ScanResult[]> {
  return scanTargets(cleanupRegistry)
}

export async function clean(targets: CleanupExecutionTarget[]): Promise<CleanupExecutionResult[]> {
  return cleanSelectedTargets(targets, macCleanerDeps)
}
