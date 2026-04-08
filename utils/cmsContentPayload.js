/**
 * AppConfig 已发布接口 content item 的 payload 收口（对齐 2026-04-08-app-remove-parsepayload-design）。
 * 合法：object（含 JSON 数组）、null；非法：string / number / boolean / undefined —— 不解析字符串，仅空态 + 可选上报。
 */

const reportedInvalid = new Set()

/**
 * @param {{ pageCode?: string, contentType?: string, slotType?: string }} [meta]
 * @param {string} payloadType
 */
function reportInvalidOnce(meta, payloadType) {
  const pageCode = meta?.pageCode ?? 'unknown'
  const component =
    [meta?.contentType, meta?.slotType].filter(Boolean).join('/') || 'unknown'
  const key = `${pageCode}|${component}|${payloadType}`
  if (reportedInvalid.has(key)) return
  reportedInvalid.add(key)
  console.warn('[appconfig] invalid CMS payload', { ...meta, payloadType })
}

/**
 * 进入渲染前的唯一入口：object / array 原样返回，其余返回 null。
 * @param {unknown} payload
 * @param {{ pageCode?: string, contentType?: string, slotType?: string }} [meta] 非法类型时用于去重上报
 * @returns {object|Array|null}
 */
export function normalizePayloadForRender(payload, meta = undefined) {
  if (payload === null || payload === undefined) return null
  if (typeof payload === 'object') return payload
  if (meta) {
    reportInvalidOnce(meta, typeof payload)
  }
  return null
}

/**
 * 槽位常见配置需普通对象（非数组）。根为数组视为不符合本用途，返回 null。
 * @param {unknown} payload
 * @param {{ pageCode?: string, contentType?: string, slotType?: string }} [meta]
 * @returns {Record<string, unknown>|null}
 */
export function normalizeCmsPayloadAsObject(payload, meta = undefined) {
  const v = normalizePayloadForRender(payload, meta)
  if (v == null) return null
  if (!Array.isArray(v)) return v
  if (meta) {
    reportInvalidOnce(meta, 'array-root')
  }
  return null
}

/**
 * 与 {@link normalizePayloadForRender} 相同，供活动卡等同时接受 object/array 的路径使用。
 * @param {unknown} payload
 * @param {{ pageCode?: string, contentType?: string, slotType?: string }} [meta]
 */
export function normalizeCmsPayload(payload, meta = undefined) {
  return normalizePayloadForRender(payload, meta)
}
