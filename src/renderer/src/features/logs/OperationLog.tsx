import type { OperationLogEntry } from '../../../../shared/cleanup-types'
import { useI18n } from '../../i18n/context'

interface Props {
  entries: OperationLogEntry[]
}

export function OperationLog({ entries }: Props): React.JSX.Element {
  const { locale, t } = useI18n()

  return (
    <section className="log">
      <h2 className="log__title">{t('operationLog')}</h2>
      {entries.length === 0 ? (
        <p className="log__empty">{t('emptyLog')}</p>
      ) : (
        <ul className="log__list">
          {entries.map((entry) => (
            <li key={entry.id} className={`log__item log__item--${entry.level}`}>
              <span className="log__time">
                {new Date(entry.timestamp).toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US')}
              </span>
              <span className="log__msg">{entry.message[locale]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
