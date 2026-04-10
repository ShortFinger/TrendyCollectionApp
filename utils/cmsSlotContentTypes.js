/**
 * Canonical slot/content types — align with sys_setting app_cms_slot_catalog
 * (see TrendyCollectionService docs/superpowers/specs/2026-04-08-app-cms-client-slot-contenttype-alignment-design.md)
 */

export const SLOT_TYPE_SEARCH_BAR = 'search_bar'
export const SLOT_TYPE_BANNER_ROW = 'banner_row'
export const SLOT_TYPE_ICON_GRID = 'icon_grid'
export const SLOT_TYPE_ACTIVITY_CARD_GRID = 'activity_card_grid'
export const SLOT_TYPE_CATEGORY_LIST = 'category_list'

export const CONTENT_TYPE_SEARCH_BAR = 'search_bar'
export const CONTENT_TYPE_BANNER_SLIDE = 'banner_slide'
export const CONTENT_TYPE_ICON_ENTRY = 'icon_entry'
export const CONTENT_TYPE_ACTIVITY_CARD_REF = 'activity_card_ref'
export const CONTENT_TYPE_CATEGORY_REF = 'category_ref'

/**
 * @param {Array<{ sortOrder?: number }> | undefined} items
 */
export function sortItemsByOrder(items) {
  if (!items?.length) return []
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

/**
 * First item matching contentType after sortOrder sort.
 * @param {Array<{ contentType?: string, payload?: string, sortOrder?: number }> | undefined} items
 * @param {string} contentType
 */
export function firstItemWithContentType(items, contentType) {
  for (const item of sortItemsByOrder(items)) {
    if (item.contentType === contentType) return item
  }
  return undefined
}

/**
 * All items matching contentType, sorted by sortOrder.
 */
export function filterItemsWithContentType(items, contentType) {
  return sortItemsByOrder(items).filter((i) => i.contentType === contentType)
}
