import type { CategoryAggregate } from '../selectors'
import { categoryLabelKey } from '../categories'
import { useI18n } from '../../i18n/context'
import { formatBytes } from '../../lib/format'

interface Props {
  aggregate: CategoryAggregate
  onOpen: () => void
}

export function CategoryCard({ aggregate, onOpen }: Props): React.JSX.Element {
  const { locale, t } = useI18n()
  const { category, totalBytes, foundCount, hasCaution } = aggregate

  return (
    <article className="card" data-category={category}>
      <header className="card__head">
        <h2 className="card__title">{t(categoryLabelKey(category))}</h2>
        {hasCaution && <span className="badge badge--caution">{t('riskCaution')}</span>}
      </header>
      <p className="card__size">{formatBytes(totalBytes, locale)}</p>
      <p className="card__count">
        {foundCount} {t('items')}
      </p>
      <button type="button" className="btn btn--ghost" onClick={onOpen} disabled={foundCount === 0}>
        {t('openDetails')}
      </button>
    </article>
  )
}
