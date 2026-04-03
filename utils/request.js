import { clearUser } from '../store/user.js'

// 多服务 base URL 配置
const API_BASE = {
  user: 'http://localhost:8083/user-api',
  order: 'http://localhost:8081/client-api',
  // TrendyCollectionAppConfig（dev 默认 8085，与 Admin 8080 错开）
  app: 'http://localhost:8085/app-api'
}
const DEFAULT_BASE = API_BASE.user

let isRefreshing = false
let pendingRequests = []
let hasNavigatedToLogin = false

function getToken() {
  return uni.getStorageSync('accessToken') || ''
}

function getRefreshToken() {
  return uni.getStorageSync('refreshToken') || ''
}

function setTokens(accessToken, refreshToken) {
  uni.setStorageSync('accessToken', accessToken)
  uni.setStorageSync('refreshToken', refreshToken)
}

function clearTokens() {
  uni.removeStorageSync('accessToken')
  uni.removeStorageSync('refreshToken')
}

async function refreshToken() {
  const rt = getRefreshToken()
  if (!rt) throw new Error('No refresh token')
  const res = await uni.request({
    url: `${API_BASE.user}/auth/refresh`,
    method: 'POST',
    data: { refreshToken: rt },
    header: { 'Content-Type': 'application/json' }
  })
  if (res.statusCode === 200 && res.data.code === 0) {
    const { accessToken, refreshToken } = res.data.data
    setTokens(accessToken, refreshToken)
    return accessToken
  }
  throw new Error('Refresh failed')
}

function retryPending(token) {
  pendingRequests.forEach(cb => cb(token))
  pendingRequests = []
}

function rejectPending(err) {
  pendingRequests.forEach(cb => cb(null, err))
  pendingRequests = []
}

export function request(options) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header = { 'Content-Type': 'application/json', ...options.header }
    if (token) header['Authorization'] = `Bearer ${token}`

    const fullUrl = options.url.startsWith('http') ? options.url : `${options.base || DEFAULT_BASE}${options.url}`

    uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: async (res) => {
        if (res.statusCode === 401) {
          pendingRequests.push((newToken, err) => {
            if (err) return reject(err)
            header['Authorization'] = `Bearer ${newToken}`
            uni.request({
              url: fullUrl, method: options.method || 'GET', data: options.data, header,
              success: (retryRes) => {
                if (retryRes.data.code === 0) resolve(retryRes.data.data)
                else reject(retryRes.data)
              },
              fail: reject
            })
          })

          if (!isRefreshing) {
            isRefreshing = true
            try {
              const newToken = await refreshToken()
              isRefreshing = false
              retryPending(newToken)
            } catch (err) {
              isRefreshing = false
              rejectPending(err)
              clearTokens()
              clearUser()

              // 避免并发 401 导致多次跳转登录页
              if (!hasNavigatedToLogin) {
                hasNavigatedToLogin = true
                uni.navigateTo({
                  url: '/pages/login/index?redirect=' + encodeURIComponent('/pages/mine/index')
                })
                setTimeout(() => {
                  hasNavigatedToLogin = false
                }, 5000)
              }
            }
          }
        } else if (res.data.code === 0) {
          resolve(res.data.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}

export { API_BASE, DEFAULT_BASE, getToken, getRefreshToken, setTokens, clearTokens }
