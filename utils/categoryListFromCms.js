import { CONTENT_TYPE_CATEGORY_REF, filterItemsWithContentType } from './cmsSlotContentTypes.js'

/**
 * 从已发布单槽 `category_list` 的 `slot` 对象构建侧栏项（与 AppConfig `category_ref` + `categoryDisplay` 对齐）。
 * 无水合数据或标题为空的条目不展示。
 *
 * @param {{ items?: Array<{ contentType?: string, sortOrder?: number, categoryDisplay?: { id?: string, title?: string } }> } | null | undefined} slot
 * @returns {Array<{ key: string, label: string }>}
 */
export function buildCategorySidebarItemsFromCmsSlot(slot) {
  const items = filterItemsWithContentType(slot?.items, CONTENT_TYPE_CATEGORY_REF)
  const out = []
  for (const item of items) {
    const d = item.categoryDisplay
    if (!d || !d.id) continue
    const label = (d.title || '').trim()
    if (!label) continue
    out.push({ key: d.id, label })
  }
  return out
}
