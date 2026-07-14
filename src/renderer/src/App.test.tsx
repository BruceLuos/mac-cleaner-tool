import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the four MVP category cards in Chinese by default', () => {
    render(<App />)

    expect(screen.getByText(/开发者缓存|Developer/)).toBeInTheDocument()
    expect(screen.getByText(/浏览器缓存|Browsers/)).toBeInTheDocument()
    expect(screen.getByText(/应用更新残留|App Updates/)).toBeInTheDocument()
    expect(screen.getByText(/Docker/)).toBeInTheDocument()
  })

  it('switches the category labels to English when the EN chip is clicked', () => {
    render(<App />)

    fireEvent.click(screen.getByText('EN'))

    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByText('Browsers')).toBeInTheDocument()
  })

  it('restores the saved locale and persists settings through the bridge', async () => {
    const saveSettings = vi.fn().mockResolvedValue(undefined)
    window.macCleaner = {
      getRegistry: vi.fn().mockResolvedValue([
        {
          id: 'npm-cache',
          category: 'developer',
          title: { zh: 'NPM 缓存', en: 'NPM Cache' },
          description: { zh: '缓存', en: 'Cache' },
          paths: ['~/.npm'],
          riskLevel: 'safe',
          cleanupMode: 'trash'
        },
        {
          id: 'chrome-cache',
          category: 'browsers',
          title: { zh: 'Chrome 缓存', en: 'Chrome Cache' },
          description: { zh: '缓存', en: 'Cache' },
          paths: ['~/Library/Caches/Google/Chrome'],
          riskLevel: 'safe',
          cleanupMode: 'trash'
        }
      ]),
      getSettings: vi.fn().mockResolvedValue({
        locale: 'en',
        enabledCategories: ['developer', 'browsers'],
        selectedTargetIds: []
      }),
      saveSettings,
      scan: vi.fn().mockResolvedValue([]),
      cleanSelected: vi.fn().mockResolvedValue([])
    }

    render(<App />)

    expect(await screen.findByText('Developer')).toBeInTheDocument()
    expect(saveSettings).not.toHaveBeenCalledWith(expect.objectContaining({ locale: 'zh' }))
  })

  it('marks disabled categories and excludes them from the total', async () => {
    window.macCleaner = {
      getRegistry: vi.fn().mockResolvedValue([
        {
          id: 'npm-cache',
          category: 'developer',
          title: { zh: 'NPM 缓存', en: 'NPM Cache' },
          description: { zh: '缓存', en: 'Cache' },
          paths: ['~/.npm'],
          riskLevel: 'safe',
          cleanupMode: 'trash'
        },
        {
          id: 'chrome-cache',
          category: 'browsers',
          title: { zh: 'Chrome 缓存', en: 'Chrome Cache' },
          description: { zh: '缓存', en: 'Cache' },
          paths: ['~/Library/Caches/Google/Chrome'],
          riskLevel: 'safe',
          cleanupMode: 'trash'
        }
      ]),
      getSettings: vi.fn().mockResolvedValue({
        locale: 'en',
        enabledCategories: ['developer'],
        selectedTargetIds: []
      }),
      saveSettings: vi.fn().mockResolvedValue(undefined),
      scan: vi.fn().mockResolvedValue([
        { id: 'npm-cache', exists: true, reclaimableBytes: 10, resolvedPaths: ['/tmp/npm'] },
        { id: 'chrome-cache', exists: true, reclaimableBytes: 100, resolvedPaths: ['/tmp/chrome'] }
      ]),
      cleanSelected: vi.fn().mockResolvedValue([])
    }

    render(<App />)

    expect(await screen.findByText('Developer')).toBeInTheDocument()
    expect(screen.getByText('Browsers')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enable category.*Browsers/ })).toBeInTheDocument()
  })
})
