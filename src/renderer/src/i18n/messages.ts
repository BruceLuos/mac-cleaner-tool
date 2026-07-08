import type { Locale } from '../lib/format'

export type { Locale }

type Dictionary = Record<string, { zh: string; en: string }>

export const STRINGS = {
  appTitle: { zh: 'Mac 清理工具', en: 'Mac Cleaner Tool' },
  appSubtitle: {
    zh: '安全优先 · 扫描可见 · 手动选择',
    en: 'Safety first · Scan visible · Manual select'
  },
  scan: { zh: '扫描', en: 'Scan' },
  scanning: { zh: '扫描中…', en: 'Scanning…' },
  cleanSelected: { zh: '清理所选', en: 'Clean Selected' },
  cleaning: { zh: '清理中…', en: 'Cleaning…' },
  totalReclaimable: { zh: '可回收总量', en: 'Total reclaimable' },
  lastScan: { zh: '上次扫描', en: 'Last scan' },
  never: { zh: '尚未扫描', en: 'never' },
  selectLanguage: { zh: '语言', en: 'Language' },
  items: { zh: '项', en: 'items' },
  openDetails: { zh: '查看详情', en: 'Details' },

  cat_developer: { zh: '开发者缓存', en: 'Developer' },
  cat_browsers: { zh: '浏览器缓存', en: 'Browsers' },
  cat_app_updates: { zh: '应用更新残留', en: 'App Updates' },
  cat_docker: { zh: 'Docker 清理', en: 'Docker' },

  riskSafe: { zh: '安全', en: 'Safe' },
  riskCaution: { zh: '谨慎', en: 'Caution' },
  modeTrash: { zh: '移至废纸篓', en: 'Move to Trash' },
  modeCommand: { zh: '命令清理', en: 'Command clean' },

  path: { zh: '路径', en: 'Path' },
  size: { zh: '大小', en: 'Size' },
  risk: { zh: '风险', en: 'Risk' },
  sizeUnknown: { zh: '清理时计算', en: 'Shown after clean' },
  notFound: { zh: '未找到', en: 'Not found' },
  selectAll: { zh: '全选', en: 'Select all' },
  clearAll: { zh: '清除', en: 'Clear' },
  close: { zh: '关闭', en: 'Close' },
  cleanOne: { zh: '清理此项', en: 'Clean this item' },
  noTargets: { zh: '该类别暂无可清理目标。', en: 'No cleanable targets in this category.' },

  operationLog: { zh: '操作日志', en: 'Operation Log' },
  emptyLog: { zh: '暂无操作记录。', en: 'No operations yet.' },
  scanDone: { zh: '扫描完成，共可回收 {bytes}。', en: 'Scan complete — {bytes} reclaimable.' },
  cleanStarted: { zh: '开始清理 {count} 项。', en: 'Cleaning {count} item(s).' },
  cleanSuccess: { zh: '「{name}」已移至废纸篓。', en: '"{name}" moved to Trash.' },
  cleanSkipped: { zh: '「{name}」已跳过：{reason}', en: '"{name}" skipped: {reason}' },
  cleanFailed: { zh: '「{name}」清理失败：{reason}', en: '"{name}" failed: {reason}' },
  noSelection: { zh: '请先勾选要清理的项目。', en: 'Select at least one item first.' },
  confirmClean: {
    zh: '确认将所选项目移至废纸篓？可在清空废纸篓前恢复。',
    en: 'Move selected items to Trash? Recoverable until you empty Trash.'
  }
} satisfies Dictionary

export type MessageKey = keyof typeof STRINGS

/** Pure translator — usable outside React (e.g. when building bilingual log entries). */
export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  const entry = STRINGS[key]
  let text = entry ? entry[locale] : String(key)
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(`{${name}}`, String(value))
    }
  }
  return text
}

/** Build both languages at once for entries that must persist bilingually. */
export function bi(
  key: MessageKey,
  params?: Record<string, string | number>
): { zh: string; en: string } {
  return { zh: translate('zh', key, params), en: translate('en', key, params) }
}
