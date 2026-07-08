import { describe, expect, it, vi } from 'vitest'

import { cleanSelectedTargets } from './cleaner'
import type { CleanupExecutionTarget } from '../../shared/cleanup-types'

describe('cleanSelectedTargets', () => {
  it('moves each selected path to Trash and reports success', async () => {
    const moveToTrash = vi.fn().mockResolvedValue(undefined)

    const results = await cleanSelectedTargets(
      [
        {
          id: 'npm-cache',
          cleanupMode: 'trash',
          resolvedPaths: ['/tmp/mac-cleaner-a', '/tmp/mac-cleaner-b']
        }
      ],
      { moveToTrash }
    )

    expect(moveToTrash).toHaveBeenCalledTimes(2)
    expect(moveToTrash).toHaveBeenCalledWith('/tmp/mac-cleaner-a')
    expect(moveToTrash).toHaveBeenCalledWith('/tmp/mac-cleaner-b')
    expect(results[0]?.status).toBe('success')
    expect(results[0]?.reclaimableBytes).toBe(0)
  })

  it('skips trash targets with no resolved paths', async () => {
    const moveToTrash = vi.fn()

    const results = await cleanSelectedTargets(
      [{ id: 'empty', cleanupMode: 'trash', resolvedPaths: [] }],
      { moveToTrash }
    )

    expect(moveToTrash).not.toHaveBeenCalled()
    expect(results[0]?.status).toBe('skipped')
    expect(results[0]?.reason).toBe('no-resolved-paths')
  })

  it('reports failure with a reason when moveToTrash throws', async () => {
    const moveToTrash = vi.fn().mockRejectedValue(new Error('in use'))

    const results = await cleanSelectedTargets(
      [{ id: 'busy', cleanupMode: 'trash', resolvedPaths: ['/tmp/mac-cleaner-busy'] }],
      { moveToTrash }
    )

    expect(results[0]?.status).toBe('failed')
    expect(results[0]?.reason).toContain('in use')
  })

  it('runs the command for command-mode targets', async () => {
    const moveToTrash = vi.fn()
    const runCommand = vi.fn().mockResolvedValue({ stdout: 'reclaimed 1.2GB', stderr: '' })

    const target: CleanupExecutionTarget = {
      id: 'docker-builder-cache',
      cleanupMode: 'command',
      resolvedPaths: [],
      command: ['docker', 'builder', 'prune', '-f']
    }

    const results = await cleanSelectedTargets([target], { moveToTrash, runCommand })

    expect(runCommand).toHaveBeenCalledWith(['docker', 'builder', 'prune', '-f'])
    expect(moveToTrash).not.toHaveBeenCalled()
    expect(results[0]?.status).toBe('success')
    expect(results[0]?.reason).toContain('reclaimed 1.2GB')
  })
})
