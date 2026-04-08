/**
 * CMS 活动卡片槽位 + OrderClient display-batch 合并（对齐 spec 2026-04-03-appconfig-activity-card-ref）
 */

import {
  CONTENT_TYPE_ACTIVITY_CARD_REF,
  SLOT_TYPE_ACTIVITY_CARD_GRID,
} from './cmsSlotContentTypes.js'
import { normalizeCmsPayload } from './cmsContentPayload.js'

const CONTENT_TYPE = CONTENT_TYPE_ACTIVITY_CARD_REF
const SLOT_TYPE = SLOT_TYPE_ACTIVITY_CARD_GRID

/** 首页 CMS 页 key；若其它页复用此工具可改为入参 */
const CMS_PAGE_CODE = 'home'

function activityItemPayloadMeta(it) {
  return {
    pageCode: CMS_PAGE_CODE,
    contentType: it.contentType,
    slotType: SLOT_TYPE
  }
}

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

/**
 * @param {Record<string, { sortOrder?: number, items?: Array<{ contentType?: string, payload?: object|string|null, sortOrder?: number }> }>} slots
 * @returns {string[]}
 */
export function collectActivityIdsFromSlots(slots) {
  const target = resolveTargetSlot(slots)
  if (!target?.items?.length) return []
  const ids = []
  const seen = new Set()
  const sorted = [...target.items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  for (const it of sorted) {
    if (it.contentType !== CONTENT_TYPE) continue
    const payload = normalizeCmsPayload(it.payload, activityItemPayloadMeta(it))
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) continue
    const aid = pickString(payload.activityId)
    if (aid && !seen.has(aid)) {
      seen.add(aid)
      ids.push(aid)
    }
  }
  return ids
}

function buildJumpUrl(activityId, activityType, payloadJumpType, payloadJumpUrl) {
  const jt = pickString(payloadJumpType) || 'page'
  const ju = pickString(payloadJumpUrl)
  if (ju) return { jumpType: jt, jumpUrl: ju }
  const t = Number(activityType)
  if (t === 7 || t === 8) {
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
 * @param {Record<string, { sortOrder?: number, items?: Array<{ contentType?: string, payload?: object|string|null, sortOrder?: number }> }>} slots 已发布页 slots（按 slotType 为键）
 * @param {Array<{ id: string, status?: number, activityType?: number, title?: string, squareThumb?: string, longThumb?: string, images?: string, moneyPrice?: number|string, lowerLeftCornerMark?: string, upperLeftCornerMark?: string, upperRightCornerMark?: string, lowerRightCornerMark?: string, tags?: string }>} activities
 * @returns {Array<{ id: string, title: string, desc: string, author: string, tag: string, likes: number, coverUrl: string, priceText: string, jumpType: string, jumpUrl: string }>}
 */
export function mergeActivityCardItems(slots, activities) {
  const list = Array.isArray(activities) ? activities : []
  const map = new Map(list.map((a) => [String(a.id), a]))

  const targetSlot = resolveTargetSlot(slots)
  if (!targetSlot?.items?.length) return []

  const sorted = [...targetSlot.items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  const out = []

  for (const it of sorted) {
    if (it.contentType !== CONTENT_TYPE) continue
    const payload = normalizeCmsPayload(it.payload, activityItemPayloadMeta(it))
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) continue
    const activityId = pickString(payload.activityId)
    if (!activityId) continue
    const act = map.get(activityId)
    if (!act || Number(act.status) !== 1) continue

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
