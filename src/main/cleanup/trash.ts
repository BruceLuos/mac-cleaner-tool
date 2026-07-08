import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { CleanerDeps } from './cleaner'

const execFileAsync = promisify(execFile)

/**
 * Production cleaner dependencies for macOS.
 *
 * `moveToTrash` delegates to Electron's `shell.trashItem`, which uses the
 * native Finder "Move to Trash" API — recoverable until the user empties
 * Trash. We import `electron` lazily so the rest of the engine stays
 * importable from Vitest without an Electron runtime.
 */
export const macCleanerDeps: CleanerDeps = {
  moveToTrash: async (path) => {
    const { shell } = await import('electron')
    await shell.trashItem(path)
  },
  runCommand: async (command) => {
    const [binary, ...args] = command
    const { stdout, stderr } = await execFileAsync(binary, args, {
      env: process.env,
      maxBuffer: 10 * 1024 * 1024
    })
    return { stdout, stderr }
  }
}
