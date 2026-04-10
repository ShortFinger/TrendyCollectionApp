/**
 * 活动卡展示共用：价格文案与跳转（CMS 与 API 列表共用）
 */

function pickString(v) {
  if (v == null) return ''
  return String(v).trim()
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
