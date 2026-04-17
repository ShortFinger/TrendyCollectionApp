/**
 * 页面栈工具：避免在已打开登录页时再 navigateTo 登录，导致叠层/反复弹出。
 */

function normalizeRoute(route) {
  return String(route || '').replace(/^\//, '')
}

export function isLoginPageRoute(route) {
  const r = normalizeRoute(route)
  return r === 'pages/login/index' || r.endsWith('/pages/login/index')
}

/** 当前栈顶是否为登录页 */
export function isLoginPageOnTop() {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const cur = pages[pages.length - 1]
  return isLoginPageRoute(cur?.route)
}

/** 栈中是否已有登录页（含非栈顶） */
export function isLoginPageInStack() {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  return pages.some((p) => isLoginPageRoute(p?.route))
}
