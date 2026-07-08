import type { ScanResult } from '../../../../shared/cleanup-types'
import { useI18n } from '../../i18n/context'
import { formatBytes } from '../../lib/format'
import { categoryLabelKey } from '../categories'
import type { CategoryAggregate } from '../selectors'

interface Props {
  aggregate: CategoryAggregate
  scanResults: Map<string, ScanResult>
  selectedIds: Set<string>
  cleaning: boolean
  onToggle: (id: string) => void
  onToggleAll: (select: boolean) => void
  onCleanOne: (id: string) => void
  onCleanSelected: () => void
  onClose: () => void
}

export function DetailDrawer({
  aggregate,
  scanResults,
  selectedIds,
  cleaning,
  onToggle,
  onToggleAll,
  onCleanOne,
  onCleanSelected,
  onClose
}: Props): React.JSX.Element {
  const { locale, t } = useI18n()
  const { entries } = aggregate

  const cleanableIds = entries
    .map((entry) => scanResults.get(entry.id))
    .filter((result): result is ScanResult => Boolean(result?.exists))
    .map((result) => result.id)
  const allSelected = cleanableIds.length > 0 && cleanableIds.every((id) => selectedIds.has(id))

  return (
    <aside className="drawer" role="dialog" aria-label={t(categoryLabelKey(aggregate.category))}>
      <header className="drawer__head">
        <h2>{t(categoryLabelKey(aggregate.category))}</h2>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {t('close')}
        </button>
      </header>

      {entries.length === 0 || cleanableIds.length === 0 ? (
        <p className="drawer__empty">{t('noTargets')}</p>
      ) : (
        <>
          <div className="drawer__toolbar">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onToggleAll(!allSelected)}
            >
              {allSelected ? t('clearAll') : t('selectAll')}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onCleanSelected}
              disabled={selectedIds.size === 0 || cleaning}
            >
              {cleaning ? t('cleaning') : `${t('cleanSelected')} (${selectedIds.size})`}
            </button>
          </div>
          <ul className="target-list">
            {entries.map((entry) => {
              const result = scanResults.get(entry.id)
              const exists = Boolean(result?.exists)
              const selected = selectedIds.has(entry.id)
              return (
                <li key={entry.id} className={`target ${selected ? 'target--selected' : ''}`}>
                  <label className="target__main">
                    <span className="target__check">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!exists || cleaning}
                        onChange={() => onToggle(entry.id)}
                      />
                    </span>
                    <span className="target__info">
                      <span className="target__title">{entry.title[locale]}</span>
                      <span className="target__desc">{entry.description[locale]}</span>
                      <span className="target__path">
                        {t('path')}:{' '}
                        <code>
                          {result?.resolvedPaths.join(', ') ||
                            entry.command?.join(' ') ||
                            (entry.paths?.join(', ') ?? '—')}
                        </code>
                      </span>
                    </span>
                  </label>
                  <span className="target__meta">
                    <span className={`badge badge--${entry.riskLevel}`}>
                      {entry.riskLevel === 'caution' ? t('riskCaution') : t('riskSafe')}
                    </span>
                    <span className="target__size">
                      {exists
                        ? entry.cleanupMode === 'command'
                          ? t('sizeUnknown')
                          : formatBytes(result?.reclaimableBytes ?? 0, locale)
                        : t('notFound')}
                    </span>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={!exists || cleaning}
                      onClick={() => onCleanOne(entry.id)}
                    >
                      {t('cleanOne')}
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </aside>
  )
}
