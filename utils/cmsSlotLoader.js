import { request, API_BASE } from './request.js'
import { getUser } from '../store/user.js'
import {
  CMS_SLOT_CACHE_TTL_MS,
  PAGE_NOT_FOUND_CODE,
  buildCmsSlotCacheKey,
  pickTraceMetaFromSlotResponses
} from './cmsSlotKeys.js'

const memorySlotCache = new Map()

export function getCmsSlotUserSegment() {
  const u = getUser()
  if (!u) return 'anon'
  const id = u.id ?? u.userId
  if (id != null && id !== '') return `u:${String(id)}`
  return 'u:unknown'
}

function getCachedSlot(cacheKey) {
  const row = memorySlotCache.get(cacheKey)
  if (!row) return null
  if (Date.now() - row.storedAt > CMS_SLOT_CACHE_TTL_MS) {
    memorySlotCache.delete(cacheKey)
    return null
  }
  return row.slot
}

function setCachedSlot(cacheKey, slot) {
  memorySlotCache.set(cacheKey, { slot, storedAt: Date.now() })
}

function slotUrl(pageKey, slotType) {
  const pk = encodeURIComponent(pageKey)
  const st = encodeURIComponent(slotType)
  return `/v1/pages/${pk}/slots/${st}`
}

/**
 * @param {{ pageKey: string, slotTypes: string[], channel: string, appVersion: string }} params
 * @returns {Promise<{ slots: Record<string, any>, errors: Array<{ slotType: string, error: any }>, pageNotFound: boolean, meta: { requestId: string, traceId: string } }>}
 */
export async function fetchPublishedSlotsForPage(params) {
  const { pageKey, slotTypes, channel, appVersion } = params
  const userSegment = getCmsSlotUserSegment()
  const dataBySlotType = {}
  const errors = []
  let pageNotFound = false

  await Promise.all(
    slotTypes.map(async (slotType) => {
      const cacheKey = buildCmsSlotCacheKey({
        pageKey,
        slotType,
        channel,
        appVersion,
        userSegment
      })
      const hit = getCachedSlot(cacheKey)
      if (hit) {
        dataBySlotType[slotType] = { slot: hit }
        return
      }
      try {
        const data = await request({
          url: slotUrl(pageKey, slotType),
          base: API_BASE.app,
          method: 'GET',
          data: { channel, appVersion }
        })
        const slot = data?.slot != null ? data.slot : { id: null, sortOrder: null, items: [] }
        setCachedSlot(cacheKey, slot)
        dataBySlotType[slotType] = data
      } catch (error) {
        const code = error && typeof error === 'object' ? error.code : undefined
        if (code === PAGE_NOT_FOUND_CODE) pageNotFound = true
        errors.push({ slotType, error })
        console.warn('[cmsSlotLoader] slot fetch failed', { pageKey, slotType, code })
      }
    })
  )

  const slots = {}
  for (const slotType of slotTypes) {
    const row = dataBySlotType[slotType]
    if (row && row.slot) slots[slotType] = row.slot
  }

  const meta = pickTraceMetaFromSlotResponses(slotTypes, dataBySlotType)

  return { slots, errors, pageNotFound, meta }
}

export { PAGE_NOT_FOUND_CODE } from './cmsSlotKeys.js'
