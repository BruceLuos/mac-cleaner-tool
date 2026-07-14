import type {
  CleanupCategory,
  CleanupTargetDefinition,
  ScanResult
} from '../../../shared/cleanup-types'

export interface CategoryAggregate {
  category: CleanupCategory
  entries: CleanupTargetDefinition[]
  totalBytes: number
  /** Number of targets the scanner actually found on disk / on PATH. */
  foundCount: number
  hasCaution: boolean
}

export function aggregateCategory(
  registry: CleanupTargetDefinition[],
  scanResults: Map<string, ScanResult>,
  category: CleanupCategory
): CategoryAggregate {
  const entries = registry.filter((entry) => entry.category === category)
  let totalBytes = 0
  let foundCount = 0
  for (const entry of entries) {
    const result = scanResults.get(entry.id)
    if (!result) continue
    totalBytes += result.reclaimableBytes
    if (result.exists) foundCount += 1
  }
  return {
    category,
    entries,
    totalBytes,
    foundCount,
    hasCaution: entries.some((entry) => entry.riskLevel === 'caution')
  }
}

export function totalReclaimable(
  registry: CleanupTargetDefinition[],
  scanResults: Map<string, ScanResult>,
  enabledCategories: CleanupCategory[]
): number {
  const enabled = new Set(enabledCategories)
  let total = 0
  for (const entry of registry) {
    if (!enabled.has(entry.category)) continue
    const result = scanResults.get(entry.id)
    if (!result) continue
    total += result.reclaimableBytes
  }
  return total
}
