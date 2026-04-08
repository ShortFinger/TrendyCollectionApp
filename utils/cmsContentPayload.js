/**
 * AppConfig 已发布接口中 content item 的 payload：
 * 服务端为 JSON object/array 或 null；旧缓存/兼容场景可能仍为 JSON 字符串。
 */

/**
 * @param {unknown} payload
 * @returns {object|Array|null}
 */
export function normalizeCmsPayload(payload) {
  if (payload == null) return null
  if (typeof payload === 'object') return payload
  if (typeof payload === 'string') {
    const t = payload.trim()
    if (!t) return null
    try {
      return JSON.parse(t)
    } catch {
      return null
    }
  }
  return null
}

/**
 * 槽位常用配置（搜索条、Banner、图标等）需普通对象，排除 array。
 * @param {unknown} payload
 * @returns {Record<string, unknown>|null}
 */
export function normalizeCmsPayloadAsObject(payload) {
  const v = normalizeCmsPayload(payload)
  if (v != null && typeof v === 'object' && !Array.isArray(v)) return v
  return null
}
