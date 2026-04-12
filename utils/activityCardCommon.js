/**
 * 活动卡展示共用：价格文案与跳转（CMS 与 API 列表共用）
 */

function pickString(v) {
  if (v == null) return ''
  return String(v).trim()
}

/**
 * @param {Record<string, unknown>|null|undefined} display activityDisplay 或同类对象
 * @returns {string} 优先 activity_type_cn（snake），否则 activityTypeCn（camel）
 */
export function pickActivityTypeCn(display) {
  if (display == null || typeof display !== 'object') return ''
  const snake = String(display.activity_type_cn ?? '').trim()
  if (snake) return snake
  return String(display.activityTypeCn ?? '').trim()
}

/**
 * @param {Record<string, unknown>|null|undefined} display activityDisplay 或同类对象
 * @returns {string} 优先 activity_type（snake），否则 activityType（camel）
 */
export function pickActivityType(display) {
  if (display == null || typeof display !== 'object') return ''
  const snake = String(display.activity_type ?? '').trim()
  if (snake) return snake
  return String(display.activityType ?? '').trim()
}

export function formatMoneyPrice(price) {
  if (price == null || price === '') return ''
  const n = Number(price)
  if (Number.isFinite(n)) {
    return `¥${n}`
  }
  return `¥${price}`
}

/**
 * @param {string} activityId
 * @param {string} activityType Order 枚举名，如 ICHIBAN
 * @param {string} payloadJumpType CMS payload，API 场景传 ''
 * @param {string} payloadJumpUrl CMS payload，API 场景传 ''
 */
export function buildActivityJump(activityId, activityType, payloadJumpType, payloadJumpUrl) {
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
