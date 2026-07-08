import type {
  CleanupCategory,
  CleanupTargetDefinition,
  ScanResult
} from '../../../../shared/cleanup-types'
import { useI18n } from '../../i18n/context'
import { formatBytes, type Locale } from '../../lib/format'
import { CATEGORY_ORDER } from '../categories'
import { aggregateCategory, totalReclaimable, type CategoryAggregate } from '../selectors'
import { CategoryCard } from './CategoryCard'

interface Props {
  registry: CleanupTargetDefinition[]
  scanResults: Map<string, ScanResult>
  lastScanAt: number | null
  scanning: boolean
  onScan: () => void
  onOpenCategory: (category: CleanupCategory) => void
}

export function Dashboard({
  registry,
  scanResults,
  lastScanAt,
  scanning,
  onScan,
  onOpenCategory
}: Props): React.JSX.Element {
  const { locale, setLocale, t } = useI18n()
  const total = totalReclaimable(scanResults)
  const aggregates: CategoryAggregate[] = CATEGORY_ORDER.map((category) =>
    aggregateCategory(registry, scanResults, category)
  )

  return (
    <section className="dashboard">
      <header className="dashboard__head">
        <div className="dashboard__titles">
          <h1>{t('appTitle')}</h1>
          <p className="dashboard__subtitle">{t('appSubtitle')}</p>
        </div>
        <div className="dashboard__lang">
          <button
            type="button"
            className={`chip ${locale === 'zh' ? 'chip--active' : ''}`}
            onClick={() => setLocale('zh' as Locale)}
          >
            中文
          </button>
          <button
            type="button"
            className={`chip ${locale === 'en' ? 'chip--active' : ''}`}
            onClick={() => setLocale('en' as Locale)}
          >
            EN
          </button>
        </div>
      </header>

      <div className="dashboard__summary">
        <div className="summary">
          <span className="summary__label">{t('totalReclaimable')}</span>
          <span className="summary__value">{formatBytes(total, locale)}</span>
        </div>
        <div className="summary">
          <span className="summary__label">{t('lastScan')}</span>
          <span className="summary__value">
            {lastScanAt ? new Date(lastScanAt).toLocaleTimeString(bcp47(locale)) : t('never')}
          </span>
        </div>
        <button type="button" className="btn btn--primary" onClick={onScan} disabled={scanning}>
          {scanning ? t('scanning') : t('scan')}
        </button>
      </div>

      <div className="card-grid">
        {aggregates.map((aggregate) => (
          <CategoryCard
            key={aggregate.category}
            aggregate={aggregate}
            onOpen={() => onOpenCategory(aggregate.category)}
          />
        ))}
      </div>
    </section>
  )
}

function bcp47(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}
