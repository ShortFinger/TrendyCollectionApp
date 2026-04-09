/**
 * CMS 活动卡片槽位合并：活动展示字段来自已发布页条目的 activityDisplay（水合）
 * 对齐 spec 2026-04-09-remove-client-display-batch
 */

import {
  CONTENT_TYPE_ACTIVITY_CARD_REF,
  SLOT_TYPE_ACTIVITY_CARD_GRID,
} from './cmsSlotContentTypes.js'

const CONTENT_TYPE = CONTENT_TYPE_ACTIVITY_CARD_REF
const SLOT_TYPE = SLOT_TYPE_ACTIVITY_CARD_GRID

/**
 * @param {Record<string, { items?: Array<{ contentType?: string }> }> | null | undefined} slots
 */
function resolveTargetSlot(slots) {
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

function buildJumpUrl(activityId, activityType, payloadJumpType, payloadJumpUrl) {
  const jt = pickString(payloadJumpType) || 'page'
  const ju = pickString(payloadJumpUrl)
  if (ju) return { jumpType: jt, jumpUrl: ju }
  const typeStr = pickString(activityType)
  if (typeStr === 'ICHIBAN' || typeStr === 'UNLIMITED') {
    return {
      jumpType: 'page',
      jumpUrl: `/pages/ichibanKuji/index?activityId=${encodeURIComponent(activityId)}`
    }
  }
  return {
    jumpType: 'page',
    jumpUrl: `/pages/ichibanKuji/index?activityId=${encodeURIComponent(activityId)}`
  }
}

function formatMoneyPrice(price) {
  if (price == null || price === '') return ''
  const n = Number(price)
  if (Number.isFinite(n)) {
    return `¥${n}`
  }
  return `¥${price}`
}

/**
 * @param {Record<string, { sortOrder?: number, items?: Array<{ contentType?: string, payload?: Object|Array|null, sortOrder?: number, activityDisplay?: Object }> }>} slots 已发布页 slots（按 slotType 为键）
 * @returns {Array<{ id: string, title: string, desc: string, author: string, tag: string, likes: number, coverUrl: string, priceText: string, jumpType: string, jumpUrl: string }>}
 */
export function mergeActivityCardItems(slots) {
  const targetSlot = resolveTargetSlot(slots)
  if (!targetSlot?.items?.length) return []

  const sorted = [...targetSlot.items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  const out = []

  for (const it of sorted) {
    if (it.contentType !== CONTENT_TYPE || !it.payload) continue
    const payload = it.payload
    if (Array.isArray(payload) || Object.prototype.toString.call(payload) !== '[object Object]') {
      continue
    }
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

    const { jumpType, jumpUrl } = buildJumpUrl(
      activityId,
      act.activityType,
      payload.jumpType,
      payload.jumpUrl
    )

    const priceText = formatMoneyPrice(act.moneyPrice)

    out.push({
      id: activityId,
      title,
      desc,
      author,
      tag,
      likes: likesNum,
      coverUrl,
      priceText,
      jumpType,
      jumpUrl,
      cornerMarks: {
        lowerLeft: pickString(payload.lowerLeftCornerMark) || pickString(act.lowerLeftCornerMark),
        upperLeft: pickString(payload.upperLeftCornerMark) || pickString(act.upperLeftCornerMark),
        upperRight: pickString(payload.upperRightCornerMark) || pickString(act.upperRightCornerMark),
        lowerRight: pickString(payload.lowerRightCornerMark) || pickString(act.lowerRightCornerMark)
      }
    })
  }

  return out
}

export { CONTENT_TYPE, SLOT_TYPE }
