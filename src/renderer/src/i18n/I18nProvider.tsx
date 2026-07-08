import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { Locale } from '../lib/format'
import { translate, type MessageKey } from './messages'
import { I18nContext, type I18nValue } from './context'

export function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [locale, setLocale] = useState<Locale>('zh')

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  )

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t }), [locale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
