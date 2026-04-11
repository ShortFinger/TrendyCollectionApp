import {
  CONTENT_TYPE_ICON_ENTRY,
  CONTENT_TYPE_ACTIVITY_CARD_REF,
  filterItemsWithContentType
} from './cmsSlotContentTypes.js'
import {
  coercePayloadForRender,
  isRenderablePayload
} from './cmsPayloadShape.js'
import { resolveActivityCardTargetSlot } from './mergeActivityCards.js'

/**
 * @param {{ items?: Array<unknown> } | null | undefined} slot
 */
export function diagnoseIconGridSlot(slot) {
  const items = slot?.items ?? []
  const iconEntries = filterItemsWithContentType(
    items,
    CONTENT_TYPE_ICON_ENTRY
  )
  let renderablePayloadCount = 0
  for (const item of iconEntries) {
    const p = coercePayloadForRender(item?.payload)
    if (isRenderablePayload(p)) renderablePayloadCount++
  }
  return {
    itemCount: items.length,
    iconEntryCount: iconEntries.length,
    renderablePayloadCount
  }
}

/**
 * @param {{ items?: Array<{ contentType?: string, payload?: unknown, activityDisplay?: { status?: string }, sortOrder?: number }> } | null | undefined} targetSlot
 */
export function diagnoseActivityCardSkips(targetSlot) {
  const items = targetSlot?.items ?? []
  const stats = {
    itemCount: items.length,
    wrongContentType: 0,
    nullPayload: 0,
    badPayloadShape: 0,
    missingActivityId: 0,
    notOnShelfOrNoDisplay: 0,
    wouldRender: 0
  }
  const sorted = [...items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  for (const it of sorted) {
    if (it.contentType !== CONTENT_TYPE_ACTIVITY_CARD_REF) {
      stats.wrongContentType++
      continue
    }
    const raw = it.payload
    if (raw == null) {
      stats.nullPayload++
      continue
    }
    const payload = coercePayloadForRender(raw)
    if (
      !isRenderablePayload(payload) ||
      Array.isArray(payload) ||
      Object.prototype.toString.call(payload) !== '[object Object]'
    ) {
      stats.badPayloadShape++
      continue
    }
    const activityId = String(payload.activityId ?? '').trim()
    if (!activityId) {
      stats.missingActivityId++
      continue
    }
    const act = it.activityDisplay
    const status = act != null ? String(act.status ?? '').trim() : ''
    if (!act || status !== 'ON_SHELF') {
      stats.notOnShelfOrNoDisplay++
      continue
    }
    stats.wouldRender++
  }
  return stats
}

/**
 * @param {ReturnType<typeof diagnoseActivityCardSkips>} stats
 */
function summarizeActivitySkipStats(stats) {
  const parts = []
  if (stats.wrongContentType)
    parts.push(`wrongContentType=${stats.wrongContentType}`)
  if (stats.nullPayload) parts.push(`nullPayload=${stats.nullPayload}`)
  if (stats.badPayloadShape) parts.push(`badPayloadShape=${stats.badPayloadShape}`)
  if (stats.missingActivityId)
    parts.push(`missingActivityId=${stats.missingActivityId}`)
  if (stats.notOnShelfOrNoDisplay)
    parts.push(
      `notOnShelfOrNoDisplay=${stats.notOnShelfOrNoDisplay} (need activity_card_ref + payload.activityId + activityDisplay.status=ON_SHELF)`
    )
  if (stats.wouldRender) parts.push(`wouldRender=${stats.wouldRender}`)
  return parts.join('; ')
}

/**
 * @param {Record<string, unknown>} slots
 * @param {number} iconListLen
 * @param {number} cardsLen
 */
export function logCmsHomeRenderDiagnostics(slots, iconListLen, cardsLen) {
  if (process.env.NODE_ENV !== 'development') return
  const ig = slots?.icon_grid
  if (ig && ig.items && ig.items.length > 0 && iconListLen === 0) {
    console.warn(
      '[cms-home] icon_grid has items but iconList is empty',
      diagnoseIconGridSlot(ig)
    )
  }
  const target = resolveActivityCardTargetSlot(slots)
  if (
    target &&
    target.items &&
    target.items.length > 0 &&
    cardsLen === 0
  ) {
    const skips = diagnoseActivityCardSkips(target)
    const hint = summarizeActivitySkipStats(skips)
    console.warn(
      `[cms-home] activity slot has items but cards is empty — ${hint}`,
      skips
    )
  }
}
