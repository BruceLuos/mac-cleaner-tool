export type Locale = 'zh' | 'en'

const BCP47: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en-US'
}

/** Locale-aware byte formatting (honors the locale's decimal/thousands separators). */
export function formatBytes(bytes: number, locale: Locale): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  const fractionDigits = value >= 100 ? 0 : value >= 10 ? 1 : 2
  const formatted = new Intl.NumberFormat(BCP47[locale], {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0
  }).format(value)
  return `${formatted} ${units[exponent]}`
}
