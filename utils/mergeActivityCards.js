/**
 * CMS 活动卡片槽位合并：活动展示字段来自已发布页条目的 activityDisplay（水合）
 * 对齐 spec 2026-04-09-remove-client-display-batch
 */

import {
  CONTENT_TYPE_ACTIVITY_CARD_REF,
  SLOT_TYPE_ACTIVITY_CARD_GRID,
} from './cmsSlotContentTypes.js'
import { coercePayloadForRender, isRenderablePayload } from './cmsPayloadShape.js'
import { formatMoneyPrice, buildActivityJump, pickActivityTypeCn } from './activityCardCommon.js'

const CONTENT_TYPE = CONTENT_TYPE_ACTIVITY_CARD_REF
const SLOT_TYPE = SLOT_TYPE_ACTIVITY_CARD_GRID

/**
 * @param {Record<string, { items?: Array<{ contentType?: string }> }> | null | undefined} slots
 */
export function resolveActivityCardTargetSlot(slots) {
  if (slots == null || typeof slots !== 'object' || Array.isArray(slots)) {
    return null
  }
  const direct = slots[SLOT_TYPE]
  if (direct?.items?.length) return direct
  for (const slot of Object.values(slots)) {
    if ((slot?.items || []).some((i) => i.contentType === CONTENT_TYPE)) {
      return slot
    }
  }
  return null
}

function firstTagFromActivity(tags) {
  if (tags == null || String(tags).trim() === '') return ''
  return String(tags).split(',')[0].trim()
}

function pickString(v) {
  if (v == null) return ''
  const s = String(v).trim()
  return s
}

/**
 * @param {Record<string, { sortOrder?: number, items?: Array<{ contentType?: string, payload?: Object|Array|null, sortOrder?: number, activityDisplay?: Object }> }>} slots 已发布页 slots（按 slotType 为键）
 * @returns {Array<{ id: string, title: string, desc: string, author: string, tag: string, likes: number, coverUrl: string, priceText: string, jumpType: string, jumpUrl: string, activityTypeCn?: string }>}
 */
export function mergeActivityCardItems(slots) {
  const targetSlot = resolveActivityCardTargetSlot(slots)
  if (!targetSlot?.items?.length) return []

  const sorted = [...targetSlot.items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  const out = []

  for (const it of sorted) {
    if (it.contentType !== CONTENT_TYPE) continue
    const rawPayload = it.payload
    if (rawPayload == null) continue
    const payload = coercePayloadForRender(rawPayload)
    if (!isRenderablePayload(payload) || Array.isArray(payload)) continue
    if (Object.prototype.toString.call(payload) !== '[object Object]') continue
    const activityId = pickString(payload.activityId)
    if (!activityId) continue
    const act = it.activityDisplay
    if (!act || pickString(act.status) !== 'ON_SHELF') continue

    const title = pickString(payload.title) || pickString(act.title) || ''
    const coverUrl =
      pickString(payload.coverUrl) ||
      pickString(act.squareThumb) ||
      pickString(act.longThumb) ||
      ''
    const desc = pickString(payload.desc)
    const author = pickString(payload.author)
    const tag =
      pickString(payload.tag) || firstTagFromActivity(act.tags)
    const likes = Number(payload.likes)
    const likesNum = Number.isFinite(likes) ? likes : 0

    const { jumpType, jumpUrl } = buildActivityJump(
      activityId,
      act.activityType,
      payload.jumpType,
      payload.jumpUrl
    )

    const priceText = formatMoneyPrice(act.moneyPrice)

    const lowerLeftCornerMark =
      pickString(payload.lowerLeftCornerMark) || pickString(act.lowerLeftCornerMark)
    const upperLeftCornerMark =
      pickString(payload.upperLeftCornerMark) || pickString(act.upperLeftCornerMark)
    const upperRightCornerMark =
      pickString(payload.upperRightCornerMark) || pickString(act.upperRightCornerMark)
    const lowerRightCornerMark =
      pickString(payload.lowerRightCornerMark) || pickString(act.lowerRightCornerMark)

    out.push({
      id: activityId,
      title,
      desc,
      author,
      tag,
      likes: likesNum,
      coverUrl,
      squareThumb: coverUrl,
      priceText,
      activityTypeCn: pickActivityTypeCn(act),
      jumpType,
      jumpUrl,
      lowerLeftCornerMark,
      upperLeftCornerMark,
      lowerRightCornerMark,
      upperRightCornerMark,
      cornerMarks: {
        lowerLeft: lowerLeftCornerMark,
        upperLeft: upperLeftCornerMark,
        upperRight: upperRightCornerMark,
        lowerRight: lowerRightCornerMark
      }
    })
  }

  return out
}

export { CONTENT_TYPE, SLOT_TYPE }
