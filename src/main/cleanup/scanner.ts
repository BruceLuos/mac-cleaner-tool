import { access, constants, readdir, stat } from 'node:fs/promises'
import { delimiter, join } from 'node:path'

import type { CleanupTargetDefinition, ScanResult } from '../../shared/cleanup-types'
import { pathExists, resolvePaths } from './path-utils'

export type { ScanResult }

/**
 * Evaluate every white-listed registry entry and report reclaimable bytes.
 * Path-mode targets are measured by recursive directory size; command-mode
 * targets are probed for binary availability (their size is discovered at
 * cleanup time, never measured up front).
 */
export async function scanTargets(definitions: CleanupTargetDefinition[]): Promise<ScanResult[]> {
  return Promise.all(definitions.map(scanOneTarget))
}

async function scanOneTarget(definition: CleanupTargetDefinition): Promise<ScanResult> {
  if (definition.cleanupMode === 'command') {
    return scanCommandTarget(definition)
  }
  return scanPathTarget(definition)
}

async function scanPathTarget(definition: CleanupTargetDefinition): Promise<ScanResult> {
  const candidates = resolvePaths(definition.paths)
  const resolvedPaths: string[] = []
  let reclaimableBytes = 0
  const errors: string[] = []

  for (const candidate of candidates) {
    try {
      if (!(await pathExists(candidate))) continue
      resolvedPaths.push(candidate)
      reclaimableBytes += await sizeOnDisk(candidate)
    } catch (error) {
      errors.push(`${candidate}: ${describeError(error)}`)
    }
  }

  return {
    id: definition.id,
    exists: resolvedPaths.length > 0,
    reclaimableBytes,
    resolvedPaths,
    error: errors.length > 0 ? errors.join('; ') : undefined
  }
}

async function scanCommandTarget(definition: CleanupTargetDefinition): Promise<ScanResult> {
  const binary = definition.command?.[0]
  if (!binary) {
    return {
      id: definition.id,
      exists: false,
      reclaimableBytes: 0,
      resolvedPaths: [],
      note: 'no-command-defined'
    }
  }

  const available = await commandAvailable(binary)
  return {
    id: definition.id,
    exists: available,
    reclaimableBytes: 0,
    resolvedPaths: [],
    note: available ? 'size-discovered-on-clean' : 'command-not-found'
  }
}

/** Recursively sum the size of a file or directory tree in bytes. */
async function sizeOnDisk(target: string): Promise<number> {
  const info = await stat(target)
  if (!info.isDirectory()) return info.size

  const entries = await readdir(target)
  // Collect then sum — accumulating into a shared counter across concurrent
  // awaits would lose updates (read-before-await, write-after-await).
  const sizes = await Promise.all(entries.map((entry) => sizeOnDisk(join(target, entry))))
  return sizes.reduce((total, size) => total + size, 0)
}

/** True when the binary is executable somewhere on PATH. */
async function commandAvailable(binary: string): Promise<boolean> {
  if (binary.includes('/')) {
    try {
      await access(binary, constants.X_OK)
      return true
    } catch {
      return false
    }
  }

  const pathEntries = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
  for (const dir of pathEntries) {
    const candidate = join(dir, binary)
    try {
      await access(candidate, constants.X_OK)
      return true
    } catch {
      continue
    }
  }
  return false
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
