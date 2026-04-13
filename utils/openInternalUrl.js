/**
 * 站内路径打开：非 tab 用 navigateTo；tab 无参 switchTab；tab 带 query 用 reLaunch。
 */

export const TAB_PATHS = [
  '/pages/index/index',
  '/pages/category/index',
  '/pages/ichibanKuji/index',
  '/pages/mine/index'
]

function pathOnly(url) {
  if (!url || typeof url !== 'string') return ''
  const q = url.indexOf('?')
  return q === -1 ? url : url.slice(0, q)
}

function withLeadingSlash(path) {
  if (!path) return ''
  return path[0] === '/' ? path : `/${path}`
}

export function openInternalUrl(url) {
  if (!url) return
  const path = withLeadingSlash(pathOnly(url))
  const fullUrl = url.includes('?') ? path + url.slice(url.indexOf('?')) : path
  const isTab = TAB_PATHS.includes(path)
  if (!isTab) {
    uni.navigateTo({ url: fullUrl })
    return
  }
  if (fullUrl.includes('?')) {
    uni.reLaunch({ url: fullUrl })
    return
  }
  uni.switchTab({ url: path })
}
