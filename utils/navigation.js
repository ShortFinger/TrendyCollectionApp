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

const DEFAULT_LOGIN_FALLBACK = '/pages/index/index'

export function normalizeLoginRedirectUrl(url, navMethod) {
  const trimmed = (url || '').trim()
  if (!trimmed) return DEFAULT_LOGIN_FALLBACK
  if (navMethod === 'switchTab') {
    const path = stripPath(trimmed)
    return path || DEFAULT_LOGIN_FALLBACK
  }
  return trimmed
}

function navigateLoginFallback(redirectUrl, app) {
  const method = getLoginRedirectNavMethod(redirectUrl, app)
  const url = normalizeLoginRedirectUrl(redirectUrl, method)
  if (method === 'switchTab') {
    uni.switchTab({
      url,
      fail: () => {
        uni.switchTab({ url: DEFAULT_LOGIN_FALLBACK })
      }
    })
  } else {
    uni.redirectTo({
      url,
      fail: () => {
        uni.switchTab({ url: DEFAULT_LOGIN_FALLBACK })
      }
    })
  }
}

/**
 * 登录成功：优先返回打开登录页的上一页；无法 back 时用 redirectUrl + tab/redirect 兜底。
 */
export function completeLoginNavigation(redirectUrl, app) {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  if (pages.length >= 2) {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        navigateLoginFallback(redirectUrl, app)
      }
    })
    return
  }
  navigateLoginFallback(redirectUrl, app)
}

/** 当前页路径 + query，供登录 redirect 兜底（如 401 打开登录且无法 navigateBack） */
export function buildCurrentPageLoginRedirect() {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const cur = pages?.[pages.length - 1]
  const route = cur?.route
  if (!route) return ''
  const path = route.startsWith('/') ? route : `/${route}`
  const opts = cur.options || {}
  const keys = Object.keys(opts).filter((k) => k !== 'redirect')
  if (!keys.length) return path
  const qs = keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(opts[k] ?? '')}`)
    .join('&')
  return `${path}?${qs}`
}
