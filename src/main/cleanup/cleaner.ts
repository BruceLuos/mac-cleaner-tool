import type { CleanupExecutionResult, CleanupExecutionTarget } from '../../shared/cleanup-types'

/** Framework-agnostic capabilities the cleaner needs. Injected so the engine stays Electron-free and testable. */
export interface CleanerDeps {
  /** Move a single absolute path to the macOS Trash. Rejects on failure. */
  moveToTrash: (path: string) => Promise<void>
  /** Run a command-mode cleanup (e.g. `docker builder prune`). Resolves with captured output. */
  runCommand?: (command: string[]) => Promise<{ stdout: string; stderr: string }>
}

/**
 * Execute only the user-selected targets. Trash-mode items move every
 * resolved path to Trash; command-mode items run their command. Each item
 * resolves to one result so a single failure never aborts the whole batch.
 */
export async function cleanSelectedTargets(
  items: CleanupExecutionTarget[],
  deps: CleanerDeps
): Promise<CleanupExecutionResult[]> {
  return Promise.all(items.map((item) => cleanOne(item, deps)))
}

async function cleanOne(
  item: CleanupExecutionTarget,
  deps: CleanerDeps
): Promise<CleanupExecutionResult> {
  if (item.cleanupMode === 'command') {
    return cleanCommand(item, deps)
  }
  return cleanPaths(item, deps)
}

async function cleanPaths(
  item: CleanupExecutionTarget,
  deps: CleanerDeps
): Promise<CleanupExecutionResult> {
  if (item.resolvedPaths.length === 0) {
    return skipped(item.id, 'no-resolved-paths')
  }

  for (const path of item.resolvedPaths) {
    try {
      await deps.moveToTrash(path)
    } catch (error) {
      return failed(item.id, describeError(error))
    }
  }

  return { id: item.id, status: 'success', reclaimableBytes: 0 }
}

async function cleanCommand(
  item: CleanupExecutionTarget,
  deps: CleanerDeps
): Promise<CleanupExecutionResult> {
  const command = item.command ?? []
  if (command.length === 0) {
    return skipped(item.id, 'no-command-defined')
  }
  if (!deps.runCommand) {
    return failed(item.id, 'no-runCommand-dep')
  }

  try {
    const { stdout } = await deps.runCommand(command)
    return {
      id: item.id,
      status: 'success',
      reclaimableBytes: 0,
      reason: stdout.trim() || undefined
    }
  } catch (error) {
    return failed(item.id, describeError(error))
  }
}

function skipped(id: string, reason: string): CleanupExecutionResult {
  return { id, status: 'skipped', reclaimableBytes: 0, reason }
}

function failed(id: string, reason: string): CleanupExecutionResult {
  return { id, status: 'failed', reclaimableBytes: 0, reason }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
