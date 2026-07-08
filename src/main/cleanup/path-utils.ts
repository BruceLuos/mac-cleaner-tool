import { stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Expand a leading `~` to the current user's home directory.
 * Only `~` and `~/...` are supported; `~otheruser` is returned unchanged.
 */
export function expandHome(path: string): string {
  if (path === '~') return homedir()
  if (path.startsWith('~/')) return join(homedir(), path.slice(2))
  return path
}

/** Resolve registry paths to expanded absolute strings (no existence check). */
export function resolvePaths(paths: string[] | undefined): string[] {
  return (paths ?? []).map(expandHome)
}

/** True when the target exists on disk (file or directory). */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
