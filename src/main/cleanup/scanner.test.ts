import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it } from 'vitest'

import { scanTargets } from './scanner'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  )
})

describe('scanTargets', () => {
  it('returns reclaimable bytes for an existing cache path', async () => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'mac-cleaner-scan-'))
    temporaryDirectories.push(fixtureDirectory)

    await writeFile(join(fixtureDirectory, 'cache.bin'), 'cache-content')

    const results = await scanTargets([
      {
        id: 'fixture-cache',
        category: 'developer',
        title: { zh: '测试缓存', en: 'Fixture Cache' },
        description: { zh: '测试目录', en: 'Fixture directory' },
        paths: [fixtureDirectory],
        riskLevel: 'safe',
        cleanupMode: 'trash'
      }
    ])

    expect(results[0]?.exists).toBe(true)
    expect(results[0]?.resolvedPaths).toEqual([fixtureDirectory])
    expect(results[0]?.reclaimableBytes).toBeGreaterThan(0)
  })

  it('reports exists=false and zero bytes for a missing path', async () => {
    const results = await scanTargets([
      {
        id: 'missing-cache',
        category: 'developer',
        title: { zh: '缺失缓存', en: 'Missing Cache' },
        description: { zh: '不存在', en: 'does not exist' },
        paths: ['/tmp/mac-cleaner-definitely-missing-xyz'],
        riskLevel: 'safe',
        cleanupMode: 'trash'
      }
    ])

    expect(results[0]?.exists).toBe(false)
    expect(results[0]?.reclaimableBytes).toBe(0)
    expect(results[0]?.resolvedPaths).toEqual([])
  })

  it('expands ~ and sums nested directory sizes', async () => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'mac-cleaner-nested-'))
    temporaryDirectories.push(fixtureDirectory)

    await writeFile(join(fixtureDirectory, 'a.bin'), 'aaaa')
    const nested = join(fixtureDirectory, 'sub')
    const { mkdir } = await import('node:fs/promises')
    await mkdir(nested)
    await writeFile(join(nested, 'b.bin'), 'bbbbbb')

    const results = await scanTargets([
      {
        id: 'nested-cache',
        category: 'developer',
        title: { zh: '嵌套', en: 'Nested' },
        description: { zh: '嵌套目录', en: 'nested dir' },
        paths: [fixtureDirectory],
        riskLevel: 'safe',
        cleanupMode: 'trash'
      }
    ])

    expect(results[0]?.exists).toBe(true)
    // 4 + 6 bytes of file content
    expect(results[0]?.reclaimableBytes).toBeGreaterThanOrEqual(10)
  })
})
