/** AppConfig 单槽缓存 TTL（与曾用整页缓存同量级） */
export const CMS_SLOT_CACHE_TTL_MS = 3 * 60 * 1000

/** 与 TrendyCollectionAppConfig ErrorCode.PAGE_NOT_FOUND 对齐 */
export const PAGE_NOT_FOUND_CODE = 40401

/**
 * @param {{ pageKey: string, slotType: string, channel: string, appVersion: string, userSegment: string }} p
 */
export function buildCmsSlotCacheKey(p) {
  return [p.pageKey, p.slotType, p.channel, p.appVersion, p.userSegment].join('\u0001')
}

/**
 * @param {string[]} slotTypesOrdered 页面声明顺序
 * @param {Record<string, any>} dataBySlotType slotType -> 单槽 API 成功时的 data 对象
 */
export function pickTraceMetaFromSlotResponses(slotTypesOrdered, dataBySlotType) {
  for (const slotType of slotTypesOrdered) {
    const data = dataBySlotType[slotType]
    if (!data || typeof data !== 'object') continue
    const requestId = (data.requestId ?? data.reqId ?? data.requestID ?? '').toString().trim()
    const traceId = (data.traceId ?? data.traceID ?? '').toString().trim()
    if (requestId || traceId) return { requestId, traceId }
  }
  return { requestId: '', traceId: '' }
}
