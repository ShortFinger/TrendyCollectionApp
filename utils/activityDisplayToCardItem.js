import {
  formatMoneyPrice,
  buildActivityJump,
  pickActivityTypeCn,
  pickActivityType
} from './activityCardCommon.js'

function pickString(v) {
  if (v == null) return ''
  return String(v).trim()
}

function firstTagFromActivity(tags) {
  if (tags == null || String(tags).trim() === '') return ''
  return String(tags).split(',')[0].trim()
}

/**
 * AppConfig 分类活动接口单条 → 与首页 ActivityFeedCard 一致的 VM
 * @param {Object} act API data.items[]
 */
export function activityDisplaySnapshotToCardItem(act) {
  if (!act || typeof act !== 'object') return null
  const id = pickString(act.id)
  if (!id) return null
  const st = pickString(act.status)
  if (st && st !== 'ON_SHELF') return null

  const squareThumb =
    pickString(act.squareThumb) || pickString(act.longThumb) || ''
  const { jumpType, jumpUrl } = buildActivityJump(
    id,
    act.activityType,
    '',
    ''
  )

  return {
    id,
    title: pickString(act.title),
    activityTypeCn: pickActivityTypeCn(act),
    activityType: pickActivityType(act),
    squareThumb,
    lowerLeftCornerMark: pickString(act.lowerLeftCornerMark),
    upperLeftCornerMark: pickString(act.upperLeftCornerMark),
    lowerRightCornerMark: pickString(act.lowerRightCornerMark),
    upperRightCornerMark: pickString(act.upperRightCornerMark),
    priceText: formatMoneyPrice(act.moneyPrice),
    desc: '',
    author: '',
    tag: firstTagFromActivity(act.tags),
    likes: 0,
    jumpType,
    jumpUrl
  }
}
