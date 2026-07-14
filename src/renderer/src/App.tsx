import { useCallback, useEffect, useState } from 'react'

import type {
  CleanupCategory,
  CleanupExecutionResult,
  CleanupExecutionTarget,
  CleanupTargetDefinition,
  OperationLogLevel,
  OperationLogEntry,
  ScanResult
} from '../../shared/cleanup-types'
import type { AppSettings } from '../../shared/settings-types'
import { Dashboard } from './features/dashboard/Dashboard'
import { DetailDrawer } from './features/dashboard/DetailDrawer'
import { aggregateCategory } from './features/selectors'
import { OperationLog } from './features/logs/OperationLog'
import { I18nProvider } from './i18n/I18nProvider'
import { useI18n } from './i18n/context'
import { bi } from './i18n/messages'
import { formatBytes } from './lib/format'

/** Build the cleaner payload for one registry id from current scan state. */
function buildTarget(
  registry: CleanupTargetDefinition[],
  scanResults: Map<string, ScanResult>,
  id: string
): CleanupExecutionTarget | null {
  const entry = registry.find((item) => item.id === id)
  const result = scanResults.get(id)
  if (!entry || !result || !result.exists) return null
  return {
    id,
    cleanupMode: entry.cleanupMode,
    resolvedPaths: result.resolvedPaths,
    command: entry.command
  }
}

function AppInner(): React.JSX.Element {
  const { locale, setLocale, t } = useI18n()
  const api = typeof window !== 'undefined' ? window.macCleaner : undefined

  const [registry, setRegistry] = useState<CleanupTargetDefinition[]>([])
  const [scanResults, setScanResults] = useState<Map<string, ScanResult>>(new Map())
  const [lastScanAt, setLastScanAt] = useState<number | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [enabledCategories, setEnabledCategories] = useState<CleanupCategory[]>([
    'developer',
    'browsers',
    'app_updates',
    'docker'
  ])
  const [settingsReady, setSettingsReady] = useState(false)
  const [openCategory, setOpenCategory] = useState<CleanupCategory | null>(null)
  const [log, setLog] = useState<OperationLogEntry[]>([])

  useEffect(() => {
    if (!api) return
    let cancelled = false
    Promise.all([api.getRegistry(), api.getSettings()])
      .then(([reg, settings]) => {
        if (cancelled) return
        const targetIds = new Set(reg.map((target) => target.id))
        const registryCategories = new Set(reg.map((target) => target.category))
        setRegistry(reg)
        setEnabledCategories(
          settings.enabledCategories.filter((category) => registryCategories.has(category))
        )
        setSelectedIds(new Set(settings.selectedTargetIds.filter((id) => targetIds.has(id))))
        setLocale(settings.locale)
        setSettingsReady(true)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [api, setLocale])

  useEffect(() => {
    if (!api || !settingsReady) return
    const settings: AppSettings = {
      locale,
      enabledCategories: [...enabledCategories],
      selectedTargetIds: [...selectedIds]
    }
    void api.saveSettings(settings).catch(() => undefined)
  }, [api, enabledCategories, locale, selectedIds, settingsReady])

  const appendLog = useCallback((level: OperationLogLevel, message: { zh: string; en: string }) => {
    const stamp = Date.now()
    setLog((prev) =>
      [
        ...prev,
        {
          id: `log-${stamp}-${Math.random().toString(36).slice(2, 8)}`,
          level,
          message,
          timestamp: stamp
        }
      ].slice(-200)
    )
  }, [])

  const refreshScan = useCallback(async (): Promise<void> => {
    if (!api) return
    const results = await api.scan()
    const map = new Map(results.map((result) => [result.id, result]))
    setScanResults(map)
    setSelectedIds((prev) => new Set([...prev].filter((id) => map.get(id)?.exists)))
    setLastScanAt(Date.now())
  }, [api])

  const handleScan = useCallback(async (): Promise<void> => {
    if (!api || scanning) return
    setScanning(true)
    try {
      const results = await api.scan()
      const map = new Map(results.map((result) => [result.id, result]))
      setScanResults(map)
      setSelectedIds((prev) => new Set([...prev].filter((id) => map.get(id)?.exists)))
      setLastScanAt(Date.now())
      const total = [...map.values()].reduce((sum, result) => sum + result.reclaimableBytes, 0)
      appendLog('info', bi('scanDone', { bytes: formatBytes(total, locale) }))
    } catch (error) {
      appendLog('error', {
        zh: `扫描失败：${describe(error)}`,
        en: `Scan failed: ${describe(error)}`
      })
    } finally {
      setScanning(false)
    }
  }, [api, scanning, appendLog, locale])

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleCategory = useCallback(
    (category: CleanupCategory) => {
      setEnabledCategories((prev) => {
        const enabled = prev.includes(category)
        if (enabled) {
          setSelectedIds((current) => {
            const next = new Set(current)
            for (const entry of registry) {
              if (entry.category === category) next.delete(entry.id)
            }
            return next
          })
          setOpenCategory((current) => (current === category ? null : current))
          return prev.filter((item) => item !== category)
        }
        return [...prev, category]
      })
    },
    [registry]
  )

  const aggregate = openCategory ? aggregateCategory(registry, scanResults, openCategory) : null

  const toggleAll = useCallback(
    (select: boolean) => {
      if (!aggregate) return
      const cleanable = aggregate.entries
        .map((entry) => scanResults.get(entry.id))
        .filter((result): result is ScanResult => Boolean(result?.exists))
        .map((result) => result.id)
      setSelectedIds((prev) => {
        const next = new Set(select ? [] : prev)
        for (const id of cleanable) {
          if (select) next.add(id)
          else next.delete(id)
        }
        return next
      })
    },
    [aggregate, scanResults]
  )

  const logResults = useCallback(
    (targets: CleanupExecutionTarget[], results: CleanupExecutionResult[]) => {
      const byId = new Map(results.map((result) => [result.id, result]))
      for (const target of targets) {
        const entry = registry.find((item) => item.id === target.id)
        const name = entry ? entry.title[locale] : target.id
        const result = byId.get(target.id)
        if (!result) continue
        if (result.status === 'success') {
          appendLog('success', bi('cleanSuccess', { name }))
        } else if (result.status === 'skipped') {
          appendLog('warning', bi('cleanSkipped', { name, reason: result.reason ?? '' }))
        } else {
          appendLog('error', bi('cleanFailed', { name, reason: result.reason ?? '' }))
        }
      }
    },
    [registry, locale, appendLog]
  )

  const runClean = useCallback(
    async (targets: CleanupExecutionTarget[]): Promise<void> => {
      if (!api || targets.length === 0) return
      if (!window.confirm(t('confirmClean'))) return
      setCleaning(true)
      appendLog('info', bi('cleanStarted', { count: targets.length }))
      try {
        const results = await api.cleanSelected(targets)
        logResults(targets, results)
        await refreshScan()
        setSelectedIds(new Set())
      } catch (error) {
        appendLog('error', {
          zh: `清理失败：${describe(error)}`,
          en: `Clean failed: ${describe(error)}`
        })
      } finally {
        setCleaning(false)
      }
    },
    [api, appendLog, logResults, refreshScan, t]
  )

  const handleCleanOne = useCallback(
    (id: string) => {
      const target = buildTarget(registry, scanResults, id)
      if (!target) return
      void runClean([target])
    },
    [registry, scanResults, runClean]
  )

  const handleCleanSelected = useCallback(() => {
    if (selectedIds.size === 0) {
      window.alert(t('noSelection'))
      return
    }
    const targets = [...selectedIds]
      .map((id) => buildTarget(registry, scanResults, id))
      .filter((target): target is CleanupExecutionTarget => target !== null)
    void runClean(targets)
  }, [selectedIds, registry, scanResults, runClean, t])

  return (
    <main className="app">
      <Dashboard
        registry={registry}
        scanResults={scanResults}
        lastScanAt={lastScanAt}
        scanning={scanning}
        enabledCategories={enabledCategories}
        onScan={handleScan}
        onToggleCategory={toggleCategory}
        onOpenCategory={(category) => {
          if (!enabledCategories.includes(category)) return
          setOpenCategory(category)
          setSelectedIds(new Set())
        }}
      />
      {openCategory && aggregate && (
        <DetailDrawer
          aggregate={aggregate}
          scanResults={scanResults}
          selectedIds={selectedIds}
          cleaning={cleaning}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onCleanOne={handleCleanOne}
          onCleanSelected={handleCleanSelected}
          onClose={() => setOpenCategory(null)}
        />
      )}
      <OperationLog entries={log} />
    </main>
  )
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message

  return String(error)
}

export default function App(): React.JSX.Element {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  )
}
