import type { CleanupCategory } from '../../../shared/cleanup-types'
import type { MessageKey } from '../i18n/messages'

export const CATEGORY_ORDER: CleanupCategory[] = ['developer', 'browsers', 'app_updates', 'docker']

export function categoryLabelKey(category: CleanupCategory): MessageKey {
  return `cat_${category}` as MessageKey
}
