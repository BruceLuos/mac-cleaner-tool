import type { CategoryAggregate } from '../selectors'
import { categoryLabelKey } from '../categories'
import { useI18n } from '../../i18n/context'
import { formatBytes } from '../../lib/format'

interface Props {
  aggregate: CategoryAggregate
  enabled: boolean
  onOpen: () => void
  onToggleEnabled: () => void
}

export function CategoryCard({
  aggregate,
  enabled,
  onOpen,
  onToggleEnabled
}: Props): React.JSX.Element {
  const { locale, t } = useI18n()
  const { category, totalBytes, foundCount, hasCaution } = aggregate

  return (
    <article className="card" data-category={category}>
      <header className="card__head">
        <h2 className="card__title">{t(categoryLabelKey(category))}</h2>
        <button
          type="button"
          className="chip"
          aria-label={`${t(enabled ? 'disableCategory' : 'enableCategory')}: ${t(categoryLabelKey(category))}`}
          onClick={onToggleEnabled}
        >
          {enabled ? '✓' : '○'}
        </button>
        {hasCaution && <span className="badge badge--caution">{t('riskCaution')}</span>}
      </header>
      <p className="card__size">{formatBytes(totalBytes, locale)}</p>
      <p className="card__count">
        {foundCount} {t('items')}
      </p>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={onOpen}
        disabled={!enabled || foundCount === 0}
      >
        {t('openDetails')}
      </button>
    </article>
  )
}
