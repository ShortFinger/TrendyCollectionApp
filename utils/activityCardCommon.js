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
 * 无 CMS 自定义 jumpUrl 时的默认站内落地路径（与 spec 默认跳转表一致）。
 * @param {string} activityId
 * @param {string} activityType Order 枚举名，如 ICHIBAN、CARD
 */
export function defaultActivityLandingUrl(activityId, activityType) {
  const id = encodeURIComponent(activityId)
  const typeStr = pickString(activityType)
  if (typeStr === 'CARD') {
    return `/pages/card/index?activityId=${id}`
  }
  if (typeStr === 'ICHIBAN' || typeStr === 'UNLIMITED') {
    return `/pages/ichibanKuji/index?activityId=${id}`
  }
  return `/pages/activity/other/index?activityId=${id}`
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
  return {
    jumpType: 'page',
    jumpUrl: defaultActivityLandingUrl(activityId, activityType)
  }
}
