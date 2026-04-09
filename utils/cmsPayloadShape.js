/**
 * CMS 条目 payload 是否可直接用于渲染（对象或数组）。
 */
export function isRenderablePayload(payload) {
  return (
    payload != null &&
    (Array.isArray(payload) ||
      Object.prototype.toString.call(payload) === '[object Object]')
  )
}

/**
 * 将 payload 规范为可渲染形态：已是对象/数组则原样返回；
 * 为非空字符串时尝试 JSON.parse 一次，解析结果为对象/数组则返回解析值，否则返回原值。
 */
export function coercePayloadForRender(raw) {
  if (raw == null) return raw
  if (isRenderablePayload(raw)) return raw
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return raw
    try {
      const p = JSON.parse(t)
      return isRenderablePayload(p) ? p : raw
    } catch {
      return raw
    }
  }
  return raw
}

/**
 * @param {{ payload?: unknown } | null | undefined} item
 * @param {Record<string, unknown>} ctx 传给 reportInvalid
 * @param {(ctx: Record<string, unknown>, raw: unknown) => void} [reportInvalid]
 */
export function normalizeCmsItemPayload(item, ctx = {}, reportInvalid) {
  const raw = item?.payload
  const payload = coercePayloadForRender(raw)
  if (isRenderablePayload(payload)) return payload
  if (typeof reportInvalid === 'function') reportInvalid(ctx, raw)
  return null
}
