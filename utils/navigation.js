/** 与 pages.json tabBar.list 的 pagePath 保持一致 */
const DEFAULT_TAB_BAR_PATHS = [
  '/pages/index/index',
  '/pages/category/index',
  '/pages/ichibanKuji/index',
  '/pages/mine/index'
]

function stripPath(url) {
  if (!url) return ''
  const [beforeHash] = String(url).split('#')
  const [path] = beforeHash.split('?')
  return path.startsWith('/') ? path : `/${path}`
}

export function isTabBarPath(url, app) {
  const list = app?.globalData?.tabBarPages ?? DEFAULT_TAB_BAR_PATHS
  const path = stripPath(url)
  return list.some((p) => path === p || path.startsWith(`${p}/`))
}

export function getLoginRedirectNavMethod(url, app) {
  return isTabBarPath(url, app) ? 'switchTab' : 'redirectTo'
}

export function normalizeLoginRedirectUrl(url, navMethod) {
  const trimmed = (url || '').trim()
  if (!trimmed) return '/pages/mine/index'
  if (navMethod === 'switchTab') {
    const path = stripPath(trimmed)
    return path || '/pages/mine/index'
  }
  return trimmed
}
