import { describe, expect, it } from 'vitest'

import { cleanupRegistry } from './registry'

describe('cleanupRegistry', () => {
  it('covers the agreed MVP categories', () => {
    const categories = new Set(cleanupRegistry.map((item) => item.category))

    expect(categories).toEqual(new Set(['developer', 'browsers', 'app_updates', 'docker']))
  })

  it('includes only regenerable Xcode and CoreSimulator cache paths', () => {
    const targets = cleanupRegistry.filter((target) =>
      ['xcode-derived-data', 'coresimulator-caches'].includes(target.id)
    )

    expect(targets).toHaveLength(2)
    expect(targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'xcode-derived-data',
          category: 'developer',
          paths: ['~/Library/Developer/Xcode/DerivedData'],
          riskLevel: 'safe',
          cleanupMode: 'trash'
        }),
        expect.objectContaining({
          id: 'coresimulator-caches',
          category: 'developer',
          paths: ['~/Library/Developer/CoreSimulator/Caches'],
          riskLevel: 'safe',
          cleanupMode: 'trash'
        })
      ])
    )
  })
})
