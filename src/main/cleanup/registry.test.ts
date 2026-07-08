import { describe, expect, it } from 'vitest'

import { cleanupRegistry } from './registry'

describe('cleanupRegistry', () => {
  it('covers the agreed MVP categories', () => {
    const categories = new Set(cleanupRegistry.map((item) => item.category))

    expect(categories).toEqual(new Set(['developer', 'browsers', 'app_updates', 'docker']))
  })
})
