import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ['src/renderer/**/*.test.tsx', 'jsdom'],
      ['src/renderer/**/*.test.ts', 'jsdom']
    ],
    globals: true,
    setupFiles: ['src/renderer/src/test/setup.ts']
  }
})
