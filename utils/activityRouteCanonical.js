import { defaultActivityLandingUrl } from './activityCardCommon.js'

function pathOnly(url) {
  if (!url || typeof url !== 'string') return ''
  const q = url.indexOf('?')
  return q === -1 ? url : url.slice(0, q)
}

function normalizeUniRoute(route) {
  if (!route) return ''
  return route.startsWith('/') ? route : `/${route}`
}

/**
 * 若当前页 path 与 activityType 对应的 canonical 落地 path 不一致，则 redirectTo 并返回 false。
 * @param {string} activityId
 * @param {string} activityType Order 枚举名
 * @returns {boolean} true 表示留在当前页；false 表示已发起 redirect
 */
export function ensureCanonicalActivityRoute(activityId, activityType) {
  const canonicalUrl = defaultActivityLandingUrl(activityId, activityType)
  const canonicalPath = pathOnly(canonicalUrl)
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  if (!pages.length) return true
  const cur = pages[pages.length - 1]
  const route = cur?.route || ''
  const currentPath = normalizeUniRoute(route)
  if (currentPath !== canonicalPath) {
    uni.redirectTo({ url: canonicalUrl })
    return false
  }
  return true
}
